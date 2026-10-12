import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const db = getServiceClient();

  const { data: run, error } = await db
    .from("scrape_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  return Response.json(run);
}
