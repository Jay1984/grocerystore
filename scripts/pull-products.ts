import { aladilAdapter } from "../src/lib/scraper/adapters/aladil";
import { hypermaxAdapter } from "../src/lib/scraper/adapters/hypermax";
import type { RetailerAdapter, ScrapedCategory, ScrapedProduct } from "../src/lib/scraper/types";
import * as fs from "fs";
import * as path from "path";

const OUT_DIR = path.join(__dirname, "..", "scraped-data");

const HYPERMAX_SEARCH_KEYWORDS = [
  "rice", "ghee", "oil", "tea", "coffee", "spices", "masala", "flour", "sugar",
  "salt", "lentils", "dal", "beans", "noodles", "pasta", "biscuits", "cookies",
  "chocolate", "juice", "water", "milk", "cheese", "butter", "yogurt", "bread",
  "chips", "snacks", "nuts", "honey", "jam", "ketchup", "sauce", "vinegar",
  "cereal", "oats", "chicken", "meat", "fish", "eggs", "fruits", "vegetables",
  "frozen", "ice cream", "baby food", "diapers", "shampoo", "soap", "detergent",
  "tissue", "cleaning", "toothpaste",
];

interface ScrapeResult {
  retailer: string;
  scrapedAt: string;
  categoriesFound: number;
  productsFound: number;
  errors: string[];
  categories: { id: string; name: string; productCount: number }[];
  products: ScrapedProduct[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function scrapeRetailer(adapter: RetailerAdapter): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    retailer: adapter.retailerSlug,
    scrapedAt: new Date().toISOString(),
    categoriesFound: 0,
    productsFound: 0,
    errors: [],
    categories: [],
    products: [],
  };

  const seenIds = new Set<string>();

  console.log(`\n========== ${adapter.retailerSlug.toUpperCase()} ==========`);
  console.log("Discovering categories...");

  const categories: ScrapedCategory[] = [];
  try {
    for await (const cat of adapter.discoverCategories()) {
      categories.push(cat);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(`Category discovery failed: ${msg}`);
    console.error(`  Category discovery error: ${msg}`);
  }

  result.categoriesFound = categories.length;
  console.log(`  Found ${categories.length} categories`);

  for (const cat of categories) {
    let catProductCount = 0;
    console.log(`  Scraping: ${cat.name} (${cat.id})...`);

    try {
      for await (const product of adapter.scrapeCategory(cat)) {
        if (!seenIds.has(product.retailerProductId)) {
          seenIds.add(product.retailerProductId);
          result.products.push(product);
          catProductCount++;
          result.productsFound++;

          if (result.productsFound % 100 === 0) {
            console.log(`    ... ${result.productsFound} products so far`);
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`${cat.name}: ${msg}`);
      console.error(`    Error in ${cat.name}: ${msg}`);
    }

    result.categories.push({ id: cat.id, name: cat.name, productCount: catProductCount });
    if (catProductCount > 0) {
      console.log(`    ${catProductCount} products from ${cat.name}`);
    }

    // Save incrementally
    const outPath = path.join(OUT_DIR, `${adapter.retailerSlug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  }

  console.log(`\n  TOTAL: ${result.productsFound} products, ${result.errors.length} errors`);
  return result;
}

async function scrapeHypermaxSearch(): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    retailer: "hypermax",
    scrapedAt: new Date().toISOString(),
    categoriesFound: 0,
    productsFound: 0,
    errors: [],
    categories: [],
    products: [],
  };

  const seenIds = new Set<string>();

  console.log("\n========== HYPERMAX (search fallback) ==========");

  for (const keyword of HYPERMAX_SEARCH_KEYWORDS) {
    console.log(`  Searching: "${keyword}"...`);
    let page = 0;

    while (page < 10) {
      await sleep(1000);
      const url = `https://www.hypermax.com.bh/mafbhr/en/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;

      let html: string;
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "text/html",
          },
        });
        if (!res.ok) break;
        html = await res.text();
      } catch {
        break;
      }

      const products = parseHypermaxHtml(html, keyword);
      if (products.length === 0) break;

      let newCount = 0;
      for (const p of products) {
        if (!seenIds.has(p.retailerProductId)) {
          seenIds.add(p.retailerProductId);
          result.products.push(p);
          result.productsFound++;
          newCount++;
        }
      }

      if (newCount === 0) break;
      console.log(`    Page ${page}: ${products.length} found, ${newCount} new (total: ${result.productsFound})`);
      page++;
    }
  }

  result.categoriesFound = HYPERMAX_SEARCH_KEYWORDS.length;
  console.log(`\n  TOTAL: ${result.productsFound} products`);
  return result;
}

function parseHypermaxHtml(html: string, categoryName: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  const linkRegex = /href="(\/mafbhr\/en\/[^"]*\/p\/(\d+)[^"]*)"/g;
  const productUrls: { href: string; id: string }[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    if (!seen.has(m[2])) {
      seen.add(m[2]);
      productUrls.push({ href: m[1].split("?")[0], id: m[2] });
    }
  }

  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{2,}/g, "\n")
    .trim();

  const lines = textContent.split("\n").map((l) => l.trim()).filter(Boolean);

  const pricePositions: { index: number; price: number }[] = [];
  for (let i = 0; i < lines.length - 3; i++) {
    // Pattern: integer | "." | decimals | "BHD"
    if (
      /^\d+$/.test(lines[i]) &&
      lines[i + 1] === "." &&
      /^\d{2,3}$/.test(lines[i + 2]) &&
      lines[i + 3] === "BHD"
    ) {
      const price = parseFloat(lines[i] + "." + lines[i + 2]);
      if (!isNaN(price) && price > 0) {
        pricePositions.push({ index: i, price });
      }
    }
  }

  for (let pi = 0; pi < pricePositions.length; pi++) {
    const { index, price } = pricePositions[pi];

    let nameIndex = index - 1;
    // Skip size/unit lines, "Only N left", delivery time lines
    while (
      nameIndex > 0 &&
      (/^[\d.]+\s*(g|gr|gm|kg|ml|l|litre|pieces?|tea bags?|bags?|counts?|tb|pcs|pack|rolls?|x\d+)$/i.test(lines[nameIndex]) ||
       /^only \d+ left$/i.test(lines[nameIndex]) ||
       /^(tue|mon|wed|thu|fri|sat|sun)\./i.test(lines[nameIndex]) ||
       lines[nameIndex] === "BHD" ||
       /^\d{2,3}$/.test(lines[nameIndex]) ||
       lines[nameIndex] === ".")
    ) {
      nameIndex--;
    }

    if (nameIndex < 0) continue;
    const name = lines[nameIndex];
    if (!name || name.length < 3 || name === "BHD" || /^\d+$/.test(name)) continue;

    const urlEntry = productUrls[pi] ?? null;

    products.push({
      retailerProductId: urlEntry?.id ?? name.replace(/\s+/g, "-").toLowerCase().slice(0, 60),
      title: name,
      brand: null,
      price,
      originalPrice: null,
      categoryPath: categoryName,
      productUrl: urlEntry
        ? `https://www.hypermax.com.bh${urlEntry.href}`
        : `https://www.hypermax.com.bh/mafbhr/en/search?keyword=${encodeURIComponent(name)}`,
      imageUrl: null,
      availability: "in_stock",
      size: null,
    });
  }

  return products;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const summary: { retailer: string; categories: number; products: number; errors: number }[] = [];

  // 1. Al Adil — Magento HTML, most reliable
  try {
    const result = await scrapeRetailer(aladilAdapter);
    const outPath = path.join(OUT_DIR, "aladil.json");
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    summary.push({
      retailer: "aladil",
      categories: result.categoriesFound,
      products: result.productsFound,
      errors: result.errors.length,
    });
  } catch (e) {
    console.error("Failed Al Adil:", e);
    summary.push({ retailer: "aladil", categories: 0, products: 0, errors: 1 });
  }

  // 2. HyperMax — try category pages first, fall back to keyword search
  try {
    const catResult = await scrapeRetailer(hypermaxAdapter);
    if (catResult.productsFound > 100) {
      const outPath = path.join(OUT_DIR, "hypermax.json");
      fs.writeFileSync(outPath, JSON.stringify(catResult, null, 2));
      summary.push({
        retailer: "hypermax",
        categories: catResult.categoriesFound,
        products: catResult.productsFound,
        errors: catResult.errors.length,
      });
    } else {
      console.log("\n  Category scrape yielded few results, trying search fallback...");
      const searchResult = await scrapeHypermaxSearch();
      // Merge any category results
      const seenIds = new Set(searchResult.products.map(p => p.retailerProductId));
      for (const p of catResult.products) {
        if (!seenIds.has(p.retailerProductId)) {
          searchResult.products.push(p);
          searchResult.productsFound++;
        }
      }
      const outPath = path.join(OUT_DIR, "hypermax.json");
      fs.writeFileSync(outPath, JSON.stringify(searchResult, null, 2));
      summary.push({
        retailer: "hypermax",
        categories: searchResult.categoriesFound,
        products: searchResult.productsFound,
        errors: searchResult.errors.length,
      });
    }
  } catch (e) {
    console.error("Failed HyperMax:", e);
    summary.push({ retailer: "hypermax", categories: 0, products: 0, errors: 1 });
  }

  // 3. LuLu — likely blocked by Cloudflare, log the result
  console.log("\n========== LULU ==========");
  console.log("  Attempting LuLu (Cloudflare-protected)...");
  try {
    const res = await fetch("https://gcc.luluhypermarket.com/en-bh/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });
    if (res.status === 403 || res.status === 429) {
      console.log(`  Blocked by Cloudflare (HTTP ${res.status})`);
      console.log("  LuLu requires manual CSV import or browser-based data collection");
      summary.push({ retailer: "lulu", categories: 0, products: 0, errors: 1 });
    } else {
      console.log(`  Got HTTP ${res.status} — attempting scrape...`);
      const { luluAdapter } = await import("../src/lib/scraper/adapters/lulu");
      const result = await scrapeRetailer(luluAdapter);
      const outPath = path.join(OUT_DIR, "lulu.json");
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      summary.push({
        retailer: "lulu",
        categories: result.categoriesFound,
        products: result.productsFound,
        errors: result.errors.length,
      });
    }
  } catch (e) {
    console.error("  LuLu error:", e instanceof Error ? e.message : e);
    summary.push({ retailer: "lulu", categories: 0, products: 0, errors: 1 });
  }

  const summaryPath = path.join(OUT_DIR, "summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify({ scrapedAt: new Date().toISOString(), retailers: summary }, null, 2)
  );

  console.log("\n\n========== FINAL SUMMARY ==========");
  let totalProducts = 0;
  for (const s of summary) {
    console.log(`  ${s.retailer}: ${s.products} products across ${s.categories} categories (${s.errors} errors)`);
    totalProducts += s.products;
  }
  console.log(`  GRAND TOTAL: ${totalProducts} products`);
  console.log(`\nResults saved to ${OUT_DIR}/`);
}

main().catch(console.error);
