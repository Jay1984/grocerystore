import { getServiceClient } from "../supabase";
import { normalizeProductName, matchConfidence } from "../normalize";

export async function runMatcher() {
  const db = getServiceClient();

  const { data: unmatched } = await db
    .from("retailer_products")
    .select("id, original_title, brand, size, unit")
    .is("product_id", null);

  if (!unmatched?.length) return { matched: 0, created: 0, queued: 0 };

  const { data: canonicalProducts } = await db
    .from("products")
    .select("id, normalized_name, brand, size, unit");

  let matched = 0;
  let created = 0;
  let queued = 0;

  for (const rp of unmatched) {
    const normalized = normalizeProductName(rp.original_title);
    const rpData = {
      brand: rp.brand,
      normalized_name: normalized,
      size: rp.size ?? "",
      unit: rp.unit ?? "",
    };

    let bestMatch: { id: string; confidence: number; type: string } | null = null;

    if (canonicalProducts?.length) {
      for (const cp of canonicalProducts) {
        const result = matchConfidence(rpData, {
          brand: cp.brand,
          normalized_name: cp.normalized_name,
          size: cp.size,
          unit: cp.unit,
        });

        if (result.confidence > (bestMatch?.confidence ?? 0)) {
          bestMatch = { id: cp.id, confidence: result.confidence, type: result.type };
        }
      }
    }

    if (bestMatch && bestMatch.type === "exact" && bestMatch.confidence >= 0.7) {
      await db
        .from("retailer_products")
        .update({ product_id: bestMatch.id })
        .eq("id", rp.id);
      matched++;
    } else if (bestMatch && bestMatch.confidence >= 0.5) {
      await db.from("manual_review_queue").insert({
        retailer_product_id: rp.id,
        review_type: "match_ambiguous",
        details: { candidate_product_id: bestMatch.id, confidence: bestMatch.confidence },
      });
      queued++;
    } else {
      const { data: newProduct } = await db
        .from("products")
        .insert({
          name: rp.original_title,
          normalized_name: normalized,
          brand: rp.brand ?? "Unknown",
          category_id: "uncategorized",
          size: rp.size ?? "N/A",
          unit: rp.unit ?? "unit",
        })
        .select("id")
        .single();

      if (newProduct) {
        await db
          .from("retailer_products")
          .update({ product_id: newProduct.id })
          .eq("id", rp.id);
        created++;
      }
    }
  }

  return { matched, created, queued };
}
