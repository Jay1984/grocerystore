import { NextRequest } from "next/server";
import { loadAllScrapedProducts } from "@/lib/scraped-data";
import { queryCanonicalProducts } from "@/lib/product-matching";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids");
  if (!ids) {
    return Response.json({ products: [] });
  }

  const idSet = new Set(ids.split(",").filter(Boolean).slice(0, 100));
  if (idSet.size === 0) {
    return Response.json({ products: [] });
  }

  const allProducts = loadAllScrapedProducts();
  const result = queryCanonicalProducts(allProducts, { pageSize: 99999 });

  const matched = result.products.filter((p) => idSet.has(p.id));

  return Response.json({ products: matched });
}
