import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/lib/search-suggestions";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "8", 10) || 8, 20);
  const category = searchParams.get("category") || undefined;
  const retailer = searchParams.get("retailer") || undefined;

  if (q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = getSuggestions({ q, limit, category, retailer });
  return NextResponse.json({ suggestions });
}
