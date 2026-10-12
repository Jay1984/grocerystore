import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
import { aladilAdapter } from "@/lib/scraper/adapters/aladil";
import { hypermaxAdapter } from "@/lib/scraper/adapters/hypermax";
import type { RetailerAdapter, ScrapedProduct } from "@/lib/scraper/types";
import { clearCache } from "@/lib/scraped-data";

function isAuthorized(request: NextRequest): boolean {
  const pw = request.headers.get("x-admin-password") ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !pw) return false;
  try {
    const a = Buffer.from(pw);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const adapters: Record<string, RetailerAdapter> = {
  aladil: aladilAdapter,
  hypermax: hypermaxAdapter,
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { retailer } = await request.json();
  const adapter = adapters[retailer];
  if (!adapter) {
    return Response.json({ error: `Unknown retailer: ${retailer}. Supported: aladil, hypermax` }, { status: 400 });
  }

  try {
    const products: ScrapedProduct[] = [];
    const categories: { id: string; name: string; url: string; parentId: string | null }[] = [];

    for await (const cat of adapter.discoverCategories()) {
      categories.push(cat);
    }

    for (const cat of categories) {
      try {
        for await (const product of adapter.scrapeCategory(cat)) {
          products.push(product);
        }
      } catch (e) {
        console.error(`Error scraping category ${cat.name}:`, e);
      }
    }

    const dataDir = path.join(process.cwd(), "scraped-data");
    const filePath = path.join(dataDir, `${retailer}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ products }, null, 2));

    const summaryPath = path.join(dataDir, "summary.json");
    let summary: Record<string, unknown> = {};
    try {
      summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
    } catch {}

    const retailers = (summary.retailers as Array<Record<string, unknown>>) || [];
    const idx = retailers.findIndex((r) => r.retailer === retailer);
    const entry = {
      retailer,
      categories: categories.length,
      products: products.length,
      errors: 0,
      lastScrapedAt: new Date().toISOString(),
    };
    if (idx >= 0) retailers[idx] = entry;
    else retailers.push(entry);
    summary.retailers = retailers;
    summary.scrapedAt = new Date().toISOString();
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    clearCache();

    return Response.json({
      ok: true,
      retailer,
      categories: categories.length,
      products: products.length,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
