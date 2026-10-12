export function normalizeProductName(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .replace(/(\d+)\s*(gm|gms|g|kg|kgs|ml|ltr|l|litre|liter)\b/gi, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .toLowerCase();
}

export function extractBrand(title: string, knownBrands: string[]): string | null {
  const lower = title.toLowerCase();
  for (const brand of knownBrands) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return null;
}

export const KNOWN_BRANDS = [
  "Red Label",
  "Brooke Bond",
  "Taj Mahal",
  "Tata Tea",
  "Wagh Bakri",
  "Lipton",
  "Al Kbous",
  "Amul",
  "Nandini",
  "Patanjali",
  "Fortune",
  "Dhara",
  "India Gate",
  "Daawat",
  "Kohinoor",
  "Sona Masoori",
  "Ponni",
  "Everest",
  "MDH",
  "Badshah",
  "Catch",
  "Eastern",
  "Lulu",
];

export function matchConfidence(
  a: { brand: string | null; normalized_name: string; size: string; unit: string },
  b: { brand: string | null; normalized_name: string; size: string; unit: string }
): { type: "exact" | "similar" | "no_match"; confidence: number } {
  const sameBrand = a.brand && b.brand && a.brand.toLowerCase() === b.brand.toLowerCase();
  const sameSize = a.size === b.size && a.unit === b.unit;

  const nameA = a.normalized_name.replace(/\s+/g, "");
  const nameB = b.normalized_name.replace(/\s+/g, "");
  const nameSimilarity = diceCoefficient(nameA, nameB);

  if (sameBrand && sameSize && nameSimilarity > 0.7) {
    return { type: "exact", confidence: Math.min(0.95, nameSimilarity) };
  }

  if (sameBrand && nameSimilarity > 0.5) {
    return { type: "similar", confidence: nameSimilarity * 0.8 };
  }

  if (nameSimilarity > 0.6 && sameSize) {
    return { type: "similar", confidence: nameSimilarity * 0.7 };
  }

  return { type: "no_match", confidence: 0 };
}

function bigrams(str: string): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    s.add(str.substring(i, i + 2));
  }
  return s;
}

function diceCoefficient(a: string, b: string): number {
  const bA = bigrams(a);
  const bB = bigrams(b);
  if (bA.size === 0 && bB.size === 0) return 1;
  let intersection = 0;
  for (const bg of bA) {
    if (bB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bA.size + bB.size);
}
