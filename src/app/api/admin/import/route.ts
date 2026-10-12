import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
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

interface LuluProduct {
  retailerProductId: string;
  title: string;
  price: number;
  productUrl: string;
  availability?: string;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const products: LuluProduct[] = body.products;

  if (!Array.isArray(products) || products.length === 0) {
    return Response.json({ error: "Expected { products: [...] } with at least one product" }, { status: 400 });
  }

  for (const p of products) {
    if (!p.retailerProductId || !p.title || typeof p.price !== "number") {
      return Response.json(
        { error: `Invalid product: needs retailerProductId, title, price. Got: ${JSON.stringify(p).slice(0, 200)}` },
        { status: 400 }
      );
    }
  }

  const dataDir = path.join(process.cwd(), "scraped-data");
  const filePath = path.join(dataDir, "lulu.json");
  fs.writeFileSync(filePath, JSON.stringify({ products }, null, 2));

  const summaryPath = path.join(dataDir, "summary.json");
  let summary: Record<string, unknown> = {};
  try {
    summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  } catch {}

  const retailers = (summary.retailers as Array<Record<string, unknown>>) || [];
  const idx = retailers.findIndex((r) => r.retailer === "lulu");
  const entry = {
    retailer: "lulu",
    categories: 0,
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

  return Response.json({ ok: true, products: products.length });
}
