import { NextRequest } from "next/server";
import { runScrape, getAdapter } from "@/lib/scraper/orchestrator";
import { timingSafeEqual } from "crypto";

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-api-key") ?? "";
  const expected = process.env.ADMIN_API_KEY ?? "";
  if (!expected || !key) return false;
  try {
    const a = Buffer.from(key);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ retailer: string }> }
) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { retailer } = await params;

  if (!getAdapter(retailer)) {
    return Response.json({ error: `Unknown retailer: ${retailer}` }, { status: 400 });
  }

  try {
    const runId = await runScrape(retailer);
    return Response.json({ runId, status: "started" });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
