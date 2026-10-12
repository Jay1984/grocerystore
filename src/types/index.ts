export interface Retailer {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo_url: string | null;
  location_context: string | null;
  created_at: string;
}

export type Category =
  | "tea"
  | "ghee"
  | "mustard-oil"
  | "rice"
  | "pav-bhaji-masala";

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: "tea", name: "Tea", icon: "☕" },
  { id: "ghee", name: "Ghee", icon: "🧈" },
  { id: "mustard-oil", name: "Mustard Oil", icon: "🫒" },
  { id: "rice", name: "Rice", icon: "🍚" },
  { id: "pav-bhaji-masala", name: "Pav Bhaji Masala", icon: "🌶️" },
];

export interface Product {
  id: string;
  name: string;
  normalized_name: string;
  brand: string;
  category: Category;
  variant: string | null;
  size: string;
  unit: string;
  size_normalized_g_or_ml: number | null;
  created_at: string;
}

export interface RetailerProduct {
  id: string;
  retailer_id: string;
  product_id: string | null;
  retailer_product_id: string | null;
  original_title: string;
  brand: string | null;
  variant: string | null;
  size: string | null;
  unit: string | null;
  product_url: string | null;
  image_url: string | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  last_seen_at: string;
}

export interface Price {
  id: string;
  retailer_product_id: string;
  price_bhd: string; // stored as text for decimal precision
  original_price_bhd: string | null;
  currency: "BHD";
  observed_at: string;
  collection_source: "scraper" | "csv_import" | "manual";
}

export interface Promotion {
  id: string;
  retailer_product_id: string;
  promotion_type: "percentage_off" | "bogo" | "multipack" | "bundle" | "other";
  description: string;
  discount_percentage: number | null;
  offer_price_bhd: string | null;
  starts_at: string | null;
  expires_at: string | null;
  requires_loyalty: boolean;
  observed_at: string;
}

export interface ProductMatch {
  id: string;
  product_id: string;
  retailer_product_id_1: string;
  retailer_product_id_2: string;
  match_type: "exact" | "similar" | "no_match";
  confidence: number;
  status: "approved" | "pending" | "rejected";
  reviewed_at: string | null;
}

export interface ComparisonResult {
  product: Product;
  retailers: {
    retailer: Retailer;
    retailerProduct: RetailerProduct;
    currentPrice: Price | null;
    promotion: Promotion | null;
  }[];
  priceDifference: string | null;
  savingsPercentage: number | null;
  cheapestRetailer: string | null;
  unitPrice: { retailerId: string; pricePerUnit: string; unit: string }[];
}

export interface BasketItem {
  productId: string;
  quantity: number;
  product?: Product;
  prices?: {
    retailerId: string;
    retailerName: string;
    price: string | null;
  }[];
}

export interface BasketComparison {
  byRetailer: {
    retailerId: string;
    retailerName: string;
    total: string;
    itemCount: number;
    missingItems: string[];
    isComplete: boolean;
  }[];
  optimized: {
    total: string;
    items: {
      productId: string;
      retailerId: string;
      retailerName: string;
      price: string;
    }[];
    savings: string;
  };
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  retailerId: string;
  retailerName: string;
}

export interface ScrapeRun {
  id: string;
  retailer_id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  products_found: number;
  products_updated: number;
  errors: number;
  error_details: string | null;
}
