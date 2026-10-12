-- GroceryCompare BH - Database Schema

-- Retailers
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website TEXT NOT NULL,
  logo_url TEXT,
  location_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- Canonical products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  variant TEXT,
  size TEXT NOT NULL,
  unit TEXT NOT NULL,
  size_normalized_g_or_ml NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_normalized ON products(normalized_name);

-- Retailer-specific product listings
CREATE TABLE retailer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) NOT NULL,
  product_id UUID REFERENCES products(id),
  retailer_product_id TEXT,
  original_title TEXT NOT NULL,
  brand TEXT,
  variant TEXT,
  size TEXT,
  unit TEXT,
  product_url TEXT,
  image_url TEXT,
  availability TEXT DEFAULT 'unknown' CHECK (availability IN ('in_stock', 'out_of_stock', 'unknown')),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(retailer_id, retailer_product_id)
);

CREATE INDEX idx_rp_retailer ON retailer_products(retailer_id);
CREATE INDEX idx_rp_product ON retailer_products(product_id);

-- Price observations (append-only)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_product_id UUID REFERENCES retailer_products(id) NOT NULL,
  price_bhd NUMERIC(10,3) NOT NULL,
  original_price_bhd NUMERIC(10,3),
  currency TEXT DEFAULT 'BHD',
  observed_at TIMESTAMPTZ DEFAULT now(),
  collection_source TEXT DEFAULT 'manual' CHECK (collection_source IN ('scraper', 'csv_import', 'manual'))
);

CREATE INDEX idx_prices_rp ON prices(retailer_product_id);
CREATE INDEX idx_prices_observed ON prices(observed_at DESC);
-- Prevent duplicate observations in same collection run (within 1 hour)
CREATE UNIQUE INDEX idx_prices_dedup ON prices(retailer_product_id, price_bhd, (date_trunc('hour', observed_at)));

-- Product matches across retailers
CREATE TABLE product_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  retailer_product_id_1 UUID REFERENCES retailer_products(id) NOT NULL,
  retailer_product_id_2 UUID REFERENCES retailer_products(id) NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'similar', 'no_match')),
  confidence NUMERIC(3,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_matches_product ON product_matches(product_id);
CREATE INDEX idx_matches_status ON product_matches(status);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_product_id UUID REFERENCES retailer_products(id) NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('percentage_off', 'bogo', 'multipack', 'bundle', 'other')),
  description TEXT,
  discount_percentage NUMERIC(5,2),
  offer_price_bhd NUMERIC(10,3),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  requires_loyalty BOOLEAN DEFAULT false,
  observed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_promotions_rp ON promotions(retailer_product_id);
CREATE INDEX idx_promotions_active ON promotions(expires_at) WHERE expires_at IS NULL OR expires_at > now();

-- Scrape run log
CREATE TABLE scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  products_found INT DEFAULT 0,
  products_updated INT DEFAULT 0,
  errors INT DEFAULT 0,
  error_details TEXT
);

-- Scrape errors
CREATE TABLE scrape_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_run_id UUID REFERENCES scrape_runs(id),
  url TEXT,
  error_message TEXT,
  error_type TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Manual review queue
CREATE TABLE manual_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_product_id UUID REFERENCES retailer_products(id),
  review_type TEXT NOT NULL CHECK (review_type IN ('match_ambiguous', 'price_anomaly', 'brand_unknown', 'size_unclear')),
  details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Seed retailers
INSERT INTO retailers (id, name, slug, website, location_context) VALUES
  ('11111111-1111-1111-1111-111111111111', 'LuLu Hypermarket', 'lulu', 'https://gcc.luluhypermarket.com/en-bh/', 'Bahrain'),
  ('22222222-2222-2222-2222-222222222222', 'Al Adil', 'aladil', 'https://bh.adilstore.com/', 'Bahrain');

-- Seed categories
INSERT INTO categories (id, name, icon, sort_order) VALUES
  ('tea', 'Tea', '☕', 1),
  ('ghee', 'Ghee', '🧈', 2),
  ('mustard-oil', 'Mustard Oil', '🫒', 3),
  ('rice', 'Rice', '🍚', 4),
  ('pav-bhaji-masala', 'Pav Bhaji Masala', '🌶️', 5);

-- Helper view for latest prices
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (retailer_product_id)
  id, retailer_product_id, price_bhd, original_price_bhd, currency, observed_at, collection_source
FROM prices
ORDER BY retailer_product_id, observed_at DESC;

-- Helper view for product comparisons
CREATE OR REPLACE VIEW product_comparison AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.brand,
  p.category_id,
  p.size,
  p.unit,
  p.size_normalized_g_or_ml,
  r.id AS retailer_id,
  r.name AS retailer_name,
  r.slug AS retailer_slug,
  rp.id AS retailer_product_id,
  rp.original_title,
  rp.product_url,
  rp.image_url,
  rp.availability,
  rp.last_seen_at,
  lp.price_bhd,
  lp.original_price_bhd,
  lp.observed_at AS price_observed_at,
  lp.collection_source
FROM products p
JOIN retailer_products rp ON rp.product_id = p.id
JOIN retailers r ON r.id = rp.retailer_id
LEFT JOIN latest_prices lp ON lp.retailer_product_id = rp.id;
