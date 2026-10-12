import type { ScrapedProduct } from "./scraped-data";
import { getDescendantIds } from "./categories";

const BRANDS = [
  "brooke bond","coffee mate","coffeemate","india gate","al ain","al alali","al islami",
  "al kabeer","al fakher","lal qilla","red label","top ramen","cup noodles","wai wai",
  "good day","hide and seek","cream treat","marie gold","smith and jones","fun foods",
  "del monte","mothers recipe","gold winner","kachi ghani","too yumm","yellow diamond",
  "50 50","oral b",
  "tata","nestle","maggi","lipton","mazola","nescafe","ahmad","twinings","twining",
  "dabur","mdh","catch","eastern","everest","saffola","fortune","aashirvaad","pillsbury",
  "britannia","parle","haldirams","haldiram","lays","kurkure","bru","nido","americana",
  "sadia","kohinoor","daawat","royal","goody","heinz","knorr","indomie","mama","yippee",
  "rahma","dalda","hayat","coroli","amul","nanak","heritage","parachute","dove","pantene",
  "sunsilk","lux","dettol","colgate","sensodyne","pampers","huggies","johnson","cerelac",
  "kelloggs","quaker","milo","ovaltine","horlicks","boost","tang","tropicana","kitkat",
  "oreo","cadbury","toblerone","ferrero","nutella","snickers","mars","bounty","twix",
  "galaxy","pringles","doritos","cheetos","sunfeast","mcvities","bourbon","patanjali",
  "swad","shan","national","badshah","suhana","chings","veeba","kissan","priya","nilons",
  "bedekar","sundrop","dhara","gemini","idhayam","gits","mtr","bikaji","balaji","garden",
  "bingo","uncle chips","hippo","vatika","gillette","close up","pepsodent",
].sort((a, b) => b.length - a.length);

function normalizeUnit(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "")
    .replace(/gms$/, "g").replace(/gm$/, "g").replace(/grams?$/, "g").replace(/gr$/, "g")
    .replace(/ltrs?$/, "l").replace(/litres?$/, "l").replace(/liters?$/, "l").replace(/lt$/, "l")
    .replace(/kgs$/, "kg")
    .replace(/mls$/, "ml");
}

const FILLERS = new Set([
  "the","a","an","and","or","with","for","in","of","from","by",
  "box","tin","jar","bottle","pouch","bag","pkt","pwdr","powder","bags","pack","packs",
  "premium","classic","original","pure","label","red","yellow","green","white","black",
  "special","new","envelop","env","rl","pwd","ea","loose","dust","leaf",
  "value","economy","mega","super","family","regular","mini","small","large","extra",
  "no","net","wt","weight","each","tea","oil","type","quality","best","fresh","natural",
]);

export function extractBrand(title: string, explicitBrand: string | null): string {
  if (explicitBrand && explicitBrand.trim()) {
    return explicitBrand.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const t = title.toLowerCase();
  for (const b of BRANDS) {
    if (t.includes(b)) {
      return b.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return "Brand Unknown";
}

export function extractMatchKey(title: string): string | null {
  let t = title.toLowerCase().replace(/[^a-z0-9\s.]/g, " ").replace(/\s+/g, " ").trim();

  let brand = "";
  for (const b of BRANDS) {
    if (t.includes(b)) {
      brand = b;
      t = t.replace(b, "").trim();
      break;
    }
  }
  if (!brand) return null;

  let size = "";
  const sizeRe = /(\d+\.?\d*)\s*(g|gm|gms|gr|gram|grams|kg|kgs|l|lt|ltr|ltrs|litre|litres|liter|liters|ml|mls)\b/gi;
  const sizeMatches = [...t.matchAll(sizeRe)];
  if (sizeMatches.length > 0) {
    const last = sizeMatches[sizeMatches.length - 1];
    size = normalizeUnit(last[0]);
    t = t.replace(last[0], "").trim();
  }

  const words = t.split(/\s+/)
    .filter(w => w.length > 1 && !FILLERS.has(w) && !/^\d+$/.test(w));

  return brand + "|" + words.sort().join(" ") + "|" + size;
}

export interface CanonicalProduct {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  size: string | null;
  matchKey: string | null;
  listings: RetailerListing[];
  cheapestRetailerId: string | null;
  savings: number | null;
}

export interface RetailerListing {
  retailerId: string;
  price: number;
  originalPrice: number | null;
  title: string;
  productUrl: string;
  imageUrl: string | null;
}

export function groupProducts(products: ScrapedProduct[]): CanonicalProduct[] {
  const keyMap = new Map<string, ScrapedProduct[]>();
  const unkeyed: ScrapedProduct[] = [];

  for (const p of products) {
    const key = extractMatchKey(p.title);
    if (key) {
      let group = keyMap.get(key);
      if (!group) {
        group = [];
        keyMap.set(key, group);
      }
      group.push(p);
    } else {
      unkeyed.push(p);
    }
  }

  const result: CanonicalProduct[] = [];

  for (const [key, group] of keyMap) {
    const retailers = new Set(group.map(p => p.retailerId));
    if (retailers.size > 1) {
      // Cross-retailer match — merge into one canonical product
      const listings: RetailerListing[] = [];
      const seen = new Set<string>();
      for (const p of group) {
        if (seen.has(p.retailerId)) continue;
        seen.add(p.retailerId);
        listings.push({
          retailerId: p.retailerId,
          price: p.price,
          originalPrice: p.originalPrice,
          title: p.title,
          productUrl: p.productUrl,
          imageUrl: p.imageUrl,
        });
      }

      const prices = listings.map(l => l.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const cheapest = listings.find(l => l.price === minPrice)!;
      const savings = maxPrice > minPrice
        ? ((maxPrice - minPrice) / maxPrice) * 100
        : null;

      const best = group.reduce((a, b) => a.title.length >= b.title.length ? a : b);
      result.push({
        id: `match-${key.replace(/[^a-z0-9]/g, "-")}`,
        title: best.title,
        brand: best.brand || group.find(g => g.brand)?.brand || null,
        category: best.category,
        size: best.size,
        matchKey: key,
        listings,
        cheapestRetailerId: savings !== null ? cheapest.retailerId : null,
        savings,
      });
    } else {
      // Single retailer — each becomes its own canonical product
      for (const p of group) {
        result.push(singleProduct(p));
      }
    }
  }

  for (const p of unkeyed) {
    result.push(singleProduct(p));
  }

  return result;
}

function singleProduct(p: ScrapedProduct): CanonicalProduct {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand,
    category: p.category,
    size: p.size,
    matchKey: null,
    listings: [{
      retailerId: p.retailerId,
      price: p.price,
      originalPrice: p.originalPrice,
      title: p.title,
      productUrl: p.productUrl,
      imageUrl: p.imageUrl,
    }],
    cheapestRetailerId: null,
    savings: null,
  };
}

export interface PaginatedCanonicalResult {
  products: CanonicalProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  crossRetailerCount: number;
}

export interface BrandFacet {
  brand: string;
  count: number;
}

export function getBrandFacets(products: ScrapedProduct[]): BrandFacet[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const brand = extractBrand(p.title, p.brand);
    counts.set(brand, (counts.get(brand) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);
}

export function queryCanonicalProducts(
  allProducts: ScrapedProduct[],
  opts: {
    q?: string;
    category?: string;
    categories?: string[];
    retailer?: string;
    brands?: string[];
    sort?: string;
    page?: number;
    pageSize?: number;
    onSale?: boolean;
  }
): PaginatedCanonicalResult {
  let filtered = allProducts;

  if (opts.categories && opts.categories.length > 0) {
    const allIds = new Set<string>();
    for (const cid of opts.categories) {
      for (const did of getDescendantIds(cid)) allIds.add(did);
    }
    filtered = filtered.filter(p => allIds.has(p.category));
  } else if (opts.category && opts.category !== "all") {
    const ids = new Set(getDescendantIds(opts.category));
    filtered = filtered.filter(p => ids.has(p.category));
  }
  if (opts.retailer && opts.retailer !== "all") {
    filtered = filtered.filter(p => p.retailerId === opts.retailer);
  }
  if (opts.onSale) {
    filtered = filtered.filter(p => p.originalPrice !== null && p.originalPrice > p.price);
  }
  if (opts.q) {
    const terms = opts.q.toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter(p => {
      const haystack = `${p.title} ${p.brand || ""} ${p.category} ${p.size || ""}`.toLowerCase();
      return terms.every(t => haystack.includes(t));
    });
  }
  if (opts.brands && opts.brands.length > 0) {
    const brandSet = new Set(opts.brands.map(b => b.toLowerCase()));
    filtered = filtered.filter(p => {
      const b = extractBrand(p.title, p.brand).toLowerCase();
      return brandSet.has(b);
    });
  }

  let canonical = groupProducts(filtered);
  const crossRetailerCount = canonical.filter(c => c.listings.length > 1).length;

  switch (opts.sort) {
    case "name":
      canonical.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "price-low":
      canonical.sort((a, b) => Math.min(...a.listings.map(l => l.price)) - Math.min(...b.listings.map(l => l.price)));
      break;
    case "price-high":
      canonical.sort((a, b) => Math.min(...b.listings.map(l => l.price)) - Math.min(...a.listings.map(l => l.price)));
      break;
    case "savings":
      canonical.sort((a, b) => {
        const sa = a.savings ?? -1;
        const sb = b.savings ?? -1;
        return sb - sa;
      });
      break;
    default:
      // Default: cross-retailer first, then by name
      canonical.sort((a, b) => {
        const aMulti = a.listings.length > 1 ? 0 : 1;
        const bMulti = b.listings.length > 1 ? 0 : 1;
        if (aMulti !== bMulti) return aMulti - bMulti;
        return a.title.localeCompare(b.title);
      });
      break;
  }

  const page = Math.max(1, opts.page || 1);
  const pageSize = opts.pageSize || 25;
  const total = canonical.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return {
    products: canonical.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    crossRetailerCount,
  };
}
