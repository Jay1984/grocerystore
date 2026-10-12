import { getServiceClient } from "../supabase";
import { normalizeProductName, extractBrand, KNOWN_BRANDS } from "../normalize";
import { parseSizeFromTitle } from "../price";
import type { RetailerAdapter, ScrapedProduct } from "./types";
import { aladilAdapter } from "./adapters/aladil";
import { hypermaxAdapter } from "./adapters/hypermax";
import { luluAdapter } from "./adapters/lulu";

const adapters: Record<string, RetailerAdapter> = {
  aladil: aladilAdapter,
  hypermax: hypermaxAdapter,
  lulu: luluAdapter,
};

export function getAdapter(slug: string): RetailerAdapter | null {
  return adapters[slug] ?? null;
}

export async function runScrape(retailerSlug: string): Promise<string> {
  const adapter = getAdapter(retailerSlug);
  if (!adapter) throw new Error(`Unknown retailer: ${retailerSlug}`);

  const db = getServiceClient();

  const { data: retailer } = await db
    .from("retailers")
    .select("id")
    .eq("slug", retailerSlug)
    .single();

  if (!retailer) throw new Error(`Retailer ${retailerSlug} not in DB`);

  const { data: run } = await db
    .from("scrape_runs")
    .insert({ retailer_id: retailer.id, status: "running" })
    .select("id")
    .single();

  if (!run) throw new Error("Failed to create scrape run");

  let productsFound = 0;
  let productsUpdated = 0;
  let errors = 0;

  try {
    const categories: { id: string; name: string; url: string; parentId: string | null }[] = [];
    for await (const cat of adapter.discoverCategories()) {
      categories.push(cat);
      await db.from("categories").upsert(
        { id: cat.id.replace(/[^a-z0-9-]/g, "-").toLowerCase(), name: cat.name, sort_order: 0 },
        { onConflict: "id" }
      );
    }

    for (const cat of categories) {
      try {
        for await (const product of adapter.scrapeCategory(cat)) {
          try {
            await processProduct(db, retailer.id, product);
            productsFound++;
          } catch (e) {
            errors++;
            await db.from("scrape_errors").insert({
              scrape_run_id: run.id,
              url: product.productUrl,
              error_message: e instanceof Error ? e.message : String(e),
              error_type: "product_processing",
            });
          }
        }
      } catch (e) {
        errors++;
        await db.from("scrape_errors").insert({
          scrape_run_id: run.id,
          url: cat.url,
          error_message: e instanceof Error ? e.message : String(e),
          error_type: "category_scrape",
        });
      }
    }

    await db
      .from("scrape_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        products_found: productsFound,
        products_updated: productsUpdated,
        errors,
      })
      .eq("id", run.id);
  } catch (e) {
    await db
      .from("scrape_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        products_found: productsFound,
        errors,
        error_details: e instanceof Error ? e.message : String(e),
      })
      .eq("id", run.id);
  }

  return run.id;
}

async function processProduct(
  db: ReturnType<typeof getServiceClient>,
  retailerId: string,
  product: ScrapedProduct
) {
  const brand = product.brand ?? extractBrand(product.title, KNOWN_BRANDS);
  const sizeInfo = parseSizeFromTitle(product.title);
  const normalizedName = normalizeProductName(product.title);

  const { data: existing } = await db
    .from("retailer_products")
    .select("id")
    .eq("retailer_id", retailerId)
    .eq("retailer_product_id", product.retailerProductId)
    .single();

  let retailerProductId: string;

  if (existing) {
    await db
      .from("retailer_products")
      .update({
        original_title: product.title,
        brand,
        size: sizeInfo?.size ?? product.size,
        unit: sizeInfo?.unit ?? null,
        product_url: product.productUrl,
        image_url: product.imageUrl,
        availability: product.availability,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    retailerProductId = existing.id;
  } else {
    const { data: inserted } = await db
      .from("retailer_products")
      .insert({
        retailer_id: retailerId,
        retailer_product_id: product.retailerProductId,
        original_title: product.title,
        brand,
        size: sizeInfo?.size ?? product.size,
        unit: sizeInfo?.unit ?? null,
        product_url: product.productUrl,
        image_url: product.imageUrl,
        availability: product.availability,
      })
      .select("id")
      .single();

    if (!inserted) throw new Error("Failed to insert retailer_product");
    retailerProductId = inserted.id;
  }

  await db.from("prices").insert({
    retailer_product_id: retailerProductId,
    price_bhd: product.price,
    original_price_bhd: product.originalPrice,
    collection_source: "scraper",
  });

  if (product.originalPrice && product.originalPrice > product.price) {
    const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
    await db.from("promotions").upsert(
      {
        retailer_product_id: retailerProductId,
        promotion_type: "percentage_off",
        description: `${discount.toFixed(0)}% off`,
        discount_percentage: discount,
        offer_price_bhd: product.price,
        observed_at: new Date().toISOString(),
      },
      { onConflict: "retailer_product_id" }
    );
  }
}
