import { loadAllScrapedProducts, type ScrapedProduct } from "./scraped-data";
import { UNIFIED_CATEGORIES } from "./categories";

export type SuggestionType = "product" | "brand" | "category" | "query";

export interface SearchSuggestion {
  type: SuggestionType;
  label: string;
  subtitle?: string;
  id: string;
  /** For products: cheapest price across retailers */
  price?: number;
  /** For products: number of retailers carrying it */
  retailerCount?: number;
  /** Category id for navigation */
  categoryId?: string;
  /** Brand name for filtering */
  brandName?: string;
  /** Icon (emoji for categories) */
  icon?: string;
  /** Product image URL */
  imageUrl?: string;
}

let _brandIndex: string[] | null = null;

function getBrandIndex(): string[] {
  if (_brandIndex) return _brandIndex;
  const brands = new Set<string>();
  for (const p of loadAllScrapedProducts()) {
    if (p.brand) brands.add(p.brand);
  }
  _brandIndex = [...brands].sort();
  return _brandIndex;
}

function isValidProductName(title: string): boolean {
  if (title.length < 5) return false;
  if (/^\d/.test(title) && title.length < 15) return false;
  return true;
}

export function getSuggestions(opts: {
  q: string;
  limit?: number;
  category?: string;
  retailer?: string;
}): SearchSuggestion[] {
  const query = opts.q.trim().toLowerCase();
  if (query.length < 2) return [];

  const limit = opts.limit ?? 8;
  const results: SearchSuggestion[] = [];
  const queryWords = query.split(/\s+/).filter(Boolean);

  // 1. Category matches (parent and subcategory)
  for (const cat of UNIFIED_CATEGORIES) {
    if (cat.id === "other") continue;
    const catLower = cat.name.toLowerCase();
    if (catLower.includes(query) || query.split(/\s+/).every((w) => catLower.includes(w))) {
      results.push({
        type: "category",
        label: cat.name,
        id: `cat-${cat.id}`,
        categoryId: cat.id,
        icon: cat.icon,
      });
    }
    if (cat.children) {
      for (const sub of cat.children) {
        const subLower = sub.name.toLowerCase();
        if (subLower.includes(query) || query.split(/\s+/).every((w) => subLower.includes(w))) {
          results.push({
            type: "category",
            label: sub.name,
            subtitle: cat.name,
            id: `cat-${sub.id}`,
            categoryId: sub.id,
            icon: cat.icon,
          });
        }
      }
    }
  }

  // 2. Brand matches
  const brands = getBrandIndex();
  const matchedBrands: string[] = [];
  for (const brand of brands) {
    if (brand.toLowerCase().includes(query)) {
      matchedBrands.push(brand);
      if (matchedBrands.length >= 3) break;
    }
  }
  for (const brand of matchedBrands) {
    results.push({
      type: "brand",
      label: brand,
      id: `brand-${brand}`,
      brandName: brand,
    });
  }

  // 3. Product matches — scored and ranked
  let allProducts = loadAllScrapedProducts();

  if (opts.category && opts.category !== "all") {
    allProducts = allProducts.filter((p) => p.category === opts.category);
  }
  if (opts.retailer && opts.retailer !== "all") {
    allProducts = allProducts.filter((p) => p.retailerId === opts.retailer);
  }

  const scored: { product: ScrapedProduct; score: number }[] = [];
  for (const p of allProducts) {
    if (!isValidProductName(p.title)) continue;
    const titleLower = p.title.toLowerCase();
    const brandLower = (p.brand || "").toLowerCase();
    const combined = `${titleLower} ${brandLower}`;

    let score = 0;

    // Exact title match
    if (titleLower === query) {
      score = 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(query)) {
      score = 80;
    }
    // Brand match + title contains rest
    else if (brandLower && brandLower.startsWith(query)) {
      score = 70;
    }
    // All query words found
    else if (queryWords.every((w) => combined.includes(w))) {
      // Word-prefix matching (words start with query words)
      const words = combined.split(/\s+/);
      const prefixMatches = queryWords.filter((qw) =>
        words.some((w) => w.startsWith(qw))
      ).length;
      score = 30 + (prefixMatches / queryWords.length) * 30;
    }
    // Partial match
    else if (combined.includes(query)) {
      score = 20;
    }

    if (score > 0) {
      scored.push({ product: p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  // Deduplicate by normalized title (keep cheapest)
  const seen = new Set<string>();
  const productLimit = limit - results.length;
  let productCount = 0;

  for (const { product: p } of scored) {
    if (productCount >= Math.max(productLimit, 5)) break;
    const key = p.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);

    // Count retailers for this product (by exact title)
    const titleLower = p.title.toLowerCase();
    const retailers = new Set<string>();
    for (const other of allProducts) {
      if (other.title.toLowerCase() === titleLower) {
        retailers.add(other.retailerId);
      }
    }

    results.push({
      type: "product",
      label: p.title,
      subtitle: p.size || undefined,
      id: p.id,
      price: p.price,
      retailerCount: retailers.size,
      categoryId: p.category,
      brandName: p.brand || undefined,
      imageUrl: p.imageUrl || undefined,
    });
    productCount++;
  }

  return results.slice(0, limit);
}
