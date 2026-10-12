import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";

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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataDir = path.join(process.cwd(), "scraped-data");

  const retailerStats = [];
  for (const retailer of ["aladil", "hypermax", "lulu"]) {
    const filePath = path.join(dataDir, `${retailer}.json`);
    try {
      const stat = fs.statSync(filePath);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      retailerStats.push({
        retailer,
        products: Array.isArray(data.products) ? data.products.length : 0,
        fileSize: stat.size,
        lastModified: stat.mtime.toISOString(),
      });
    } catch {
      retailerStats.push({ retailer, products: 0, fileSize: 0, lastModified: null });
    }
  }

  let summary = null;
  try {
    summary = JSON.parse(fs.readFileSync(path.join(dataDir, "summary.json"), "utf-8"));
  } catch {}

  return Response.json({ retailers: retailerStats, summary });
}
