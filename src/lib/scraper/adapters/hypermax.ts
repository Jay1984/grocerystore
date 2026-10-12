import type {
  RetailerAdapter,
  ScrapedCategory,
  ScrapedProduct,
} from "../types";

const BASE_URL = "https://www.hypermax.com.bh";
const LAT = "26.20926164864932";
const LNG = "50.45117116051133";
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

interface MenuResponse {
  foodCategories?: MenuCategory[];
  nonFoodCategories?: MenuCategory[];
}

interface MenuCategory {
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  url?: string;
  categories?: MenuCategory[];
  children?: MenuCategory[];
}

export const hypermaxAdapter: RetailerAdapter = {
  retailerSlug: "hypermax",

  async *discoverCategories(): AsyncGenerator<ScrapedCategory> {
    const res = await fetch(
      `${BASE_URL}/api/v1/menu?lang=en&latitude=${LAT}&longitude=${LNG}`,
      { headers: { ...HEADERS, Accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`Menu API returned ${res.status}`);
    const data: MenuResponse = await res.json();

    const allCats = [
      ...(data.foodCategories ?? []),
      ...(data.nonFoodCategories ?? []),
    ];

    function* flatten(
      items: MenuCategory[],
      parentId: string | null
    ): Generator<ScrapedCategory> {
      for (const item of items) {
        const id = item.id?.toString() ?? item.slug ?? "";
        const name = item.name || item.title || "";
        if (id && name) {
          yield {
            id,
            name,
            url: `${BASE_URL}/mafbhr/en/c/${id}`,
            parentId,
          };
        }
        const children = item.categories ?? item.children ?? [];
        if (children.length) {
          yield* flatten(children, id);
        }
      }
    }

    yield* flatten(allCats, null);
  },

  async *scrapeCategory(
    category: ScrapedCategory
  ): AsyncGenerator<ScrapedProduct> {
    let page = 0;
    const maxPages = 50;

    while (page < maxPages) {
      await sleep(DELAY_MS);
      const url = `${BASE_URL}/mafbhr/en/c/${category.id}?page=${page}`;

      let html: string;
      try {
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) break;
        html = await res.text();
      } catch {
        break;
      }

      const products = parseProductsFromHtml(html, category.name);
      if (products.length === 0) break;

      for (const p of products) {
        yield p;
      }

      page++;
    }
  },
};

function parseProductsFromHtml(
  html: string,
  categoryName: string
): ScrapedProduct[] {
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

  // Extract page text to find product names and prices
  // The server-rendered text has patterns like:
  //   ProductName\nSize\nPrice\n.decimals\nBHD
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

    // Match with a product URL by index order
    const urlEntry = productUrls[pi] ?? null;

    products.push({
      retailerProductId: urlEntry?.id ?? name.replace(/\s+/g, "-").toLowerCase().slice(0, 60),
      title: name,
      brand: null,
      price,
      originalPrice: null,
      categoryPath: categoryName,
      productUrl: urlEntry
        ? `${BASE_URL}${urlEntry.href}`
        : `${BASE_URL}/mafbhr/en/search?keyword=${encodeURIComponent(name)}`,
      imageUrl: null,
      availability: "in_stock",
      size: null,
    });
  }

  return products;
}
