import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const search = request.nextUrl.searchParams.get("q");

  let query = supabase.from("product_comparison").select("*");

  if (category) {
    query = query.eq("category_id", category);
  }

  if (search) {
    query = query.or(`product_name.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
