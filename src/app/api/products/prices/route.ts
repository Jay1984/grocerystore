import { NextRequest } from "next/server";
import { loadAllScrapedProducts } from "@/lib/scraped-data";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids");
  if (!ids) {
    return Response.json({ prices: {} });
  }

  const idList = ids.split(",").filter(Boolean);
  const idSet = new Set(idList);
  const allProducts = loadAllScrapedProducts();

  const prices: Record<string, { price: number; originalPrice: number | null; retailerId: string }> = {};

  for (const p of allProducts) {
    if (!idSet.has(p.id)) continue;
    const existing = prices[p.id];
    if (!existing || p.price < existing.price) {
      prices[p.id] = {
        price: p.price,
        originalPrice: p.originalPrice,
        retailerId: p.retailerId,
      };
    }
  }

  return Response.json({ prices });
}
