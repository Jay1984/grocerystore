import Decimal from "decimal.js";

Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

export function formatBHD(value: string | number | null): string {
  if (value === null || value === undefined) return "—";
  return `BHD ${new Decimal(value).toFixed(3)}`;
}

export function priceDifference(a: string, b: string): string {
  return new Decimal(a).minus(new Decimal(b)).abs().toFixed(3);
}

export function savingsPercentage(higher: string, lower: string): number {
  const h = new Decimal(higher);
  const l = new Decimal(lower);
  if (h.isZero()) return 0;
  return h.minus(l).div(h).times(100).toDecimalPlaces(1).toNumber();
}

export function unitPrice(
  price: string,
  sizeValue: number,
  sizeUnit: string,
  targetUnit: string
): string {
  const p = new Decimal(price);
  const size = new Decimal(sizeValue);

  let normalizedSize: Decimal;

  if (sizeUnit === targetUnit) {
    normalizedSize = size;
  } else if (sizeUnit === "g" && targetUnit === "100g") {
    normalizedSize = size.div(100);
  } else if (sizeUnit === "kg" && targetUnit === "100g") {
    normalizedSize = size.times(10);
  } else if (sizeUnit === "ml" && targetUnit === "L") {
    normalizedSize = size.div(1000);
  } else if (sizeUnit === "L" && targetUnit === "L") {
    normalizedSize = size;
  } else if (sizeUnit === "kg" && targetUnit === "kg") {
    normalizedSize = size;
  } else if (sizeUnit === "g" && targetUnit === "kg") {
    normalizedSize = size.div(1000);
  } else {
    return "—";
  }

  if (normalizedSize.isZero()) return "—";
  return p.div(normalizedSize).toFixed(3);
}

export function normalizeUnit(raw: string): string {
  const u = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    gm: "g",
    gms: "g",
    gram: "g",
    grams: "g",
    kg: "kg",
    kgs: "kg",
    ml: "ml",
    ltr: "L",
    liter: "L",
    litre: "L",
    liters: "L",
    litres: "L",
    l: "L",
  };
  return map[u] || u;
}

export function parseSizeFromTitle(title: string): {
  size: string;
  unit: string;
  sizeNormalized: number | null;
} | null {
  const match = title.match(
    /(\d+(?:\.\d+)?)\s*(gm|gms|g|kg|kgs|ml|ltr|l|litre|liter)\b/i
  );
  if (!match) return null;

  const sizeVal = parseFloat(match[1]);
  const unit = normalizeUnit(match[2]);

  let sizeNormalized: number | null = null;
  if (unit === "g") sizeNormalized = sizeVal;
  else if (unit === "kg") sizeNormalized = sizeVal * 1000;
  else if (unit === "ml") sizeNormalized = sizeVal;
  else if (unit === "L") sizeNormalized = sizeVal * 1000;

  return { size: `${sizeVal}${unit}`, unit, sizeNormalized };
}
