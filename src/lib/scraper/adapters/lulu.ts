import * as cheerio from "cheerio";
import type {
  RetailerAdapter,
  ScrapedCategory,
  ScrapedProduct,
} from "../types";

const BASE_URL = "https://gcc.luluhypermarket.com";
const DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string, attempt = 1): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    },
  });

  if (res.status === 403 || res.status === 429) {
    if (attempt < 3) {
      const backoff = DELAY_MS * Math.pow(2, attempt);
      await sleep(backoff);
      return fetchPage(url, attempt + 1);
    }
    throw new Error(`Blocked by Cloudflare (${res.status}) after ${attempt} attempts for ${url}`);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export const luluAdapter: RetailerAdapter = {
  retailerSlug: "lulu",

  async *discoverCategories(): AsyncGenerator<ScrapedCategory> {
    let html: string;
    try {
      html = await fetchPage(`${BASE_URL}/en-bh/`);
    } catch (e) {
      console.error("LuLu: blocked by Cloudflare during category discovery. Use CSV import fallback.", e);
      return;
    }

    const $ = cheerio.load(html);
    const seen = new Set<string>();

    $('a[href*="/en-bh/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const name = $(el).text().trim();
      const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      if (
        name &&
        fullUrl.includes("/en-bh/") &&
        !fullUrl.includes("account") &&
        !fullUrl.includes("login") &&
        !fullUrl.includes("cart") &&
        !seen.has(fullUrl)
      ) {
        seen.add(fullUrl);
        const pathParts = fullUrl.replace(`${BASE_URL}/en-bh/`, "").replace(/\/$/, "").split("/");
        if (pathParts.length >= 1 && pathParts[0]) {
          const id = pathParts.join("/");
          (this as unknown as { _yield: ScrapedCategory })._yield = {
            id,
            name,
            url: fullUrl,
            parentId: pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : null,
          };
        }
      }
    });

    // Re-parse since we can't yield inside .each()
    const categories: ScrapedCategory[] = [];
    $('a[href*="/en-bh/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const name = $(el).text().trim();
      const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      if (
        name &&
        fullUrl.includes("/en-bh/") &&
        !fullUrl.includes("account") &&
        !fullUrl.includes("login") &&
        !fullUrl.includes("cart") &&
        !seen.has(fullUrl + "_done")
      ) {
        seen.add(fullUrl + "_done");
        const pathParts = fullUrl.replace(`${BASE_URL}/en-bh/`, "").replace(/\/$/, "").split("/");
        if (pathParts.length >= 1 && pathParts[0]) {
          categories.push({
            id: pathParts.join("/"),
            name,
            url: fullUrl,
            parentId: pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : null,
          });
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
      const url = `${category.url}?page=${page}`;

      let html: string;
      try {
        html = await fetchPage(url);
      } catch (e) {
        console.error(`LuLu: failed to fetch ${url}:`, e);
        break;
      }

      const $ = cheerio.load(html);

      // Try JSON-LD first
      const products: ScrapedProduct[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          const items = data["@type"] === "ItemList"
            ? (data.itemListElement ?? [])
            : data["@type"] === "Product"
              ? [data]
              : [];

          for (const item of items) {
            const product = item.item ?? item;
            if (product["@type"] !== "Product") continue;

            const name = product.name ?? "";
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            const price = parseFloat(offer?.price ?? "0");
            if (!name || !price) continue;

            products.push({
              retailerProductId: product.sku ?? product.productID ?? name.slice(0, 60),
              title: name,
              brand: product.brand?.name ?? null,
              price,
              originalPrice: null,
              categoryPath: category.name,
              productUrl: product.url ?? offer?.url ?? category.url,
              imageUrl: product.image ?? null,
              availability:
                offer?.availability?.includes("InStock") ? "in_stock" : "out_of_stock",
              size: null,
            });
          }
        } catch {
          // ignore invalid JSON-LD
        }
      });

      // Try __NEXT_DATA__ if no JSON-LD products found
      if (products.length === 0) {
        $('script#__NEXT_DATA__').each((_, el) => {
          try {
            const data = JSON.parse($(el).html() || "{}");
            const pageProps = data.props?.pageProps ?? {};
            const items = pageProps.products ?? pageProps.items ?? pageProps.data?.products ?? [];

            for (const item of items) {
              const name = item.name ?? item.title ?? "";
              const price = item.price ?? item.salePrice ?? 0;
              if (!name || !price) continue;

              products.push({
                retailerProductId: item.sku ?? item.id?.toString() ?? name.slice(0, 60),
                title: name,
                brand: item.brand ?? null,
                price: typeof price === "string" ? parseFloat(price) : price,
                originalPrice: item.originalPrice ?? item.wasPrice ?? null,
                categoryPath: category.name,
                productUrl: item.url ?? `${BASE_URL}/en-bh/${item.slug ?? ""}`,
                imageUrl: item.image ?? item.imageUrl ?? null,
                availability: item.inStock === false ? "out_of_stock" : "in_stock",
                size: item.size ?? null,
              });
            }
          } catch {
            // ignore
          }
        });
      }

      // Fallback: parse HTML product cards
      if (products.length === 0) {
        $(".product-card, .product-item, [data-testid*='product']").each((_, el) => {
          try {
            const $el = $(el);
            const name = $el.find("h3, .product-name, .product-title, [data-testid*='name']").first().text().trim();
            const priceText = $el.find(".price, [data-testid*='price']").first().text().trim();
            const price = parsePrice(priceText);
            if (!name || !price) return;

            const link = $el.find("a").first().attr("href") ?? "";
            const imgSrc = $el.find("img").first().attr("src") ?? null;

            products.push({
              retailerProductId: link.split("/").filter(Boolean).pop() ?? name.slice(0, 60),
              title: name,
              brand: null,
              price,
              originalPrice: null,
              categoryPath: category.name,
              productUrl: link.startsWith("http") ? link : `${BASE_URL}${link}`,
              imageUrl: imgSrc,
              availability: "in_stock",
              size: null,
            });
          } catch {
            // skip
          }
        });
      }

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const p of products) {
        yield p;
      }

      page++;
      if (page > 50) hasMore = false; // safety cap
    }
  },
};

function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}
