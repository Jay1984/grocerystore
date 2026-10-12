import fs from "fs";
import path from "path";
import {
  ALADIL_CATEGORY_MAP,
  HYPERMAX_CATEGORY_MAP,
  UNIFIED_CATEGORIES,
  inferCategoryFromTitle,
  resolveToParent,
  getDescendantIds,
  type SubCategory,
} from "./categories";
import { parseSizeFromTitle } from "./price";

export interface ScrapedProduct {
  id: string;
  retailerId: string;
  title: string;
  brand: string | null;
  category: string;
  price: number;
  originalPrice: number | null;
  productUrl: string;
  imageUrl: string | null;
  availability: string;
  size: string | null;
}

interface AladilRaw {
  retailerProductId: string;
  title: string;
  brand: string | null;
  price: number;
  originalPrice: number | null;
  categoryPath: string;
  productUrl: string;
  imageUrl: string;
  availability: string;
  size: string | null;
}

interface HypermaxRaw {
  id: string;
  name: string;
  price: number;
  category: string;
  url: string;
}

interface LuluRaw {
  retailerProductId: string;
  title: string;
  price: number;
  productUrl: string;
  availability: string;
}

function readJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "scraped-data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

let _cache: ScrapedProduct[] | null = null;

function loadAladilProducts(): ScrapedProduct[] {
  const data = readJson<{ products: AladilRaw[] }>("aladil.json");
  return data.products.map((p) => {
    const mappedCat = ALADIL_CATEGORY_MAP[p.categoryPath] || "other";
    const subFromTitle = inferCategoryFromTitle(p.title);
    const parentMapped = resolveToParent(mappedCat);
    const parentTitle = resolveToParent(subFromTitle);
    const category = parentMapped === parentTitle ? subFromTitle : mappedCat;
    return {
      id: `aladil-${p.retailerProductId}`,
      retailerId: "aladil",
      title: p.title,
      brand: p.brand || null,
      category,
      price: p.price,
      originalPrice: p.originalPrice,
      productUrl: p.productUrl,
      imageUrl: p.imageUrl || null,
      availability: p.availability || "in_stock",
      size: p.size || parseSizeFromTitle(p.title)?.size || null,
    };
  });
}

export function extractHypermaxTitle(p: HypermaxRaw): string {
  if (p.name && p.name.length >= 15 && !/^\d/.test(p.name)) return p.name;
  const m = p.url.match(/\/([^/]+)\/p\/\d+$/);
  if (m) {
    return m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return p.name;
}

function loadHypermaxProducts(): ScrapedProduct[] {
  const data = readJson<{ products: HypermaxRaw[] }>("hypermax.json");
  return data.products.map((p) => {
    const title = extractHypermaxTitle(p);
    const mappedCat = HYPERMAX_CATEGORY_MAP[p.category] || "other";
    const subFromTitle = inferCategoryFromTitle(title);
    const parentMapped = resolveToParent(mappedCat);
    const parentTitle = resolveToParent(subFromTitle);
    const category = parentMapped === parentTitle ? subFromTitle : mappedCat;
    return {
      id: `hypermax-${p.id}`,
      retailerId: "hypermax",
      title,
      brand: null,
      category,
      price: p.price,
      originalPrice: null,
      productUrl: p.url,
      imageUrl: null,
      availability: "in_stock",
      size: parseSizeFromTitle(p.name)?.size || null,
    };
  });
}

function loadLuluProducts(): ScrapedProduct[] {
  const data = readJson<{ products: LuluRaw[] }>("lulu.json");
  return data.products.map((p) => ({
    id: `lulu-${p.retailerProductId}`,
    retailerId: "lulu",
    title: p.title,
    brand: null,
    category: inferCategoryFromTitle(p.title),
    price: p.price,
    originalPrice: null,
    productUrl: p.productUrl,
    imageUrl: null,
    availability: p.availability || "in_stock",
    size: parseSizeFromTitle(p.title)?.size || null,
  }));
}

export function clearCache() {
  _cache = null;
}

export function loadAllScrapedProducts(): ScrapedProduct[] {
  if (_cache) return _cache;
  _cache = [
    ...loadAladilProducts(),
    ...loadHypermaxProducts(),
    ...loadLuluProducts(),
  ];
  return _cache;
}

export function getScrapedByCategory(categoryId: string): ScrapedProduct[] {
  const ids = new Set(getDescendantIds(categoryId));
  return loadAllScrapedProducts().filter((p) => ids.has(p.category));
}

export function getScrapedByRetailer(retailerId: string): ScrapedProduct[] {
  return loadAllScrapedProducts().filter((p) => p.retailerId === retailerId);
}

export function searchScrapedProducts(query: string): ScrapedProduct[] {
  const q = query.toLowerCase();
  return loadAllScrapedProducts().filter((p) =>
    p.title.toLowerCase().includes(q) ||
    (p.brand && p.brand.toLowerCase().includes(q))
  );
}

export function getScrapedDeals(): ScrapedProduct[] {
  return loadAllScrapedProducts().filter(
    (p) => p.originalPrice !== null && p.originalPrice > p.price
  );
}

export interface PaginatedResult {
  products: ScrapedProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function queryScrapedProducts(opts: {
  q?: string;
  category?: string;
  categories?: string[];
  retailer?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  onSale?: boolean;
}): PaginatedResult {
  let products = loadAllScrapedProducts();

  if (opts.categories && opts.categories.length > 0) {
    const allIds = new Set<string>();
    for (const cid of opts.categories) {
      for (const did of getDescendantIds(cid)) allIds.add(did);
    }
    products = products.filter((p) => allIds.has(p.category));
  } else if (opts.category && opts.category !== "all") {
    const ids = new Set(getDescendantIds(opts.category));
    products = products.filter((p) => ids.has(p.category));
  }
  if (opts.retailer && opts.retailer !== "all") {
    products = products.filter((p) => p.retailerId === opts.retailer);
  }
  if (opts.onSale) {
    products = products.filter(
      (p) => p.originalPrice !== null && p.originalPrice > p.price
    );
  }
  if (opts.q) {
    const terms = opts.q.toLowerCase().split(/\s+/).filter(Boolean);
    products = products.filter((p) => {
      const haystack = `${p.title} ${p.brand || ""} ${p.category} ${p.size || ""}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  switch (opts.sort) {
    case "name":
      products = [...products].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "price-low":
      products = [...products].sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      products = [...products].sort((a, b) => b.price - a.price);
      break;
    case "discount":
      products = [...products].sort((a, b) => {
        const da = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const db = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return db - da;
      });
      break;
    default:
      break;
  }

  const page = Math.max(1, opts.page || 1);
  const pageSize = opts.pageSize || 25;
  const total = products.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return {
    products: products.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  count: number;
  byRetailer: Record<string, number>;
  children: {
    id: string;
    name: string;
    count: number;
  }[];
}

export function getScrapedCategoryStats(): CategoryStat[] {
  const all = loadAllScrapedProducts();
  const counts = new Map<string, { total: number; byRetailer: Record<string, number> }>();

  for (const p of all) {
    const parentId = resolveToParent(p.category);

    // Count at parent level
    let parentEntry = counts.get(parentId);
    if (!parentEntry) {
      parentEntry = { total: 0, byRetailer: {} };
      counts.set(parentId, parentEntry);
    }
    parentEntry.total++;
    parentEntry.byRetailer[p.retailerId] = (parentEntry.byRetailer[p.retailerId] || 0) + 1;

    // Count at subcategory level (only if product has a subcategory)
    if (p.category !== parentId) {
      let subEntry = counts.get(p.category);
      if (!subEntry) {
        subEntry = { total: 0, byRetailer: {} };
        counts.set(p.category, subEntry);
      }
      subEntry.total++;
      subEntry.byRetailer[p.retailerId] = (subEntry.byRetailer[p.retailerId] || 0) + 1;
    }
  }

  return UNIFIED_CATEGORIES
    .map((cat) => {
      const entry = counts.get(cat.id);
      const children: CategoryStat["children"] = [];
      if (cat.children) {
        for (const sub of cat.children) {
          const subEntry = counts.get(sub.id);
          if (subEntry && subEntry.total > 0) {
            children.push({ id: sub.id, name: sub.name, count: subEntry.total });
          }
        }
      }
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        count: entry?.total || 0,
        byRetailer: entry?.byRetailer || {},
        children,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}
