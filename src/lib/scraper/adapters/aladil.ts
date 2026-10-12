import * as cheerio from "cheerio";
import type {
  RetailerAdapter,
  ScrapedCategory,
  ScrapedProduct,
} from "../types";

const BASE_URL = "https://bh.adilstore.com";
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export const aladilAdapter: RetailerAdapter = {
  retailerSlug: "aladil",

  async *discoverCategories(): AsyncGenerator<ScrapedCategory> {
    const html = await fetchPage(BASE_URL);
    const $ = cheerio.load(html);

    const categories: ScrapedCategory[] = [];
    const seen = new Set<string>();
    $("nav.navigation a, .nav-sections a").each((_, el) => {
      const href = $(el).attr("href");
      const name = $(el).text().trim();
      if (
        href &&
        name &&
        href.startsWith(BASE_URL) &&
        !href.includes("account") &&
        !href.includes("contact") &&
        !seen.has(href)
      ) {
        seen.add(href);
        const id = href.replace(BASE_URL, "").replace(/^\/|\.html$/g, "");
        if (id) {
          categories.push({ id, name, url: href, parentId: null });
        }
      }
    });

    for (const cat of categories) {
      yield cat;
    }
  },

  async *scrapeCategory(
    category: ScrapedCategory
  ): AsyncGenerator<ScrapedProduct> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      await sleep(DELAY_MS);
      const url = `${category.url}?p=${page}`;
      let html: string;
      try {
        html = await fetchPage(url);
      } catch {
        break;
      }

      const $ = cheerio.load(html);
      const items = $(".product-item, .product-items .item");

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      for (const el of items.toArray()) {
        try {
          const $el = $(el);
          const title =
            $el.find(".product-item-link, .product-name a").text().trim() || "";
          const productUrl =
            $el.find(".product-item-link, .product-name a").attr("href") || "";
          const imageUrl =
            $el.find("img.product-image-photo").attr("src") || null;

          const priceText =
            $el.find(".price-wrapper .price, .special-price .price").first().text().trim();
          const originalPriceText =
            $el.find(".old-price .price").first().text().trim();

          const price = parsePrice(priceText);
          if (!price || !title) continue;

          const originalPrice = parsePrice(originalPriceText);

          const retailerProductId =
            $el.find("[data-product-id]").attr("data-product-id") ||
            productUrl.split("/").filter(Boolean).pop() ||
            title.replace(/\s+/g, "-").toLowerCase().slice(0, 60);

          const availability = $el.find(".stock.unavailable").length
            ? ("out_of_stock" as const)
            : ("in_stock" as const);

          yield {
            retailerProductId,
            title,
            brand: null,
            price,
            originalPrice,
            categoryPath: category.name,
            productUrl,
            imageUrl,
            availability,
            size: null,
          };
        } catch {
          continue;
        }
      }

      const hasNext =
        $(".pages .next, .action.next").length > 0 ||
        $(`.pages a[href*="p=${page + 1}"]`).length > 0;
      if (!hasNext) hasMore = false;
      page++;
    }
  },
};

function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}
