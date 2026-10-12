import { SEED_PRODUCTS, RETAILERS, type SeedProduct } from "./seed-data";
import { savingsPercentage, unitPrice } from "./price";
import type { Category } from "@/types";

export interface RetailerPrice {
  retailerId: string;
  retailerName: string;
  color: string;
  price: string | null;
  originalPrice: string | null;
}

export interface ProductComparison {
  product: SeedProduct;
  retailers: RetailerPrice[];
  cheapestRetailerId: string | null;
  cheapestRetailerName: string | null;
  savings: number | null;
  difference: string | null;
}

export function getProductsByCategory(category: Category): SeedProduct[] {
  return SEED_PRODUCTS.filter((p) => p.category === category);
}

export function getComparisons(category?: Category): ProductComparison[] {
  const products = category
    ? getProductsByCategory(category)
    : SEED_PRODUCTS;

  return products.map((product) => {
    const retailers: RetailerPrice[] = RETAILERS.map((r) => {
      const found = product.prices.find((p) => p.retailer === r.id);
      return {
        retailerId: r.id,
        retailerName: r.name,
        color: r.color,
        price: found?.price ?? null,
        originalPrice: found?.originalPrice ?? null,
      };
    });

    const withPrices = retailers.filter((r) => r.price !== null);
    let cheapestRetailerId: string | null = null;
    let cheapestRetailerName: string | null = null;
    let savings: number | null = null;
    let difference: string | null = null;

    if (withPrices.length >= 2) {
      const sorted = [...withPrices].sort(
        (a, b) => parseFloat(a.price!) - parseFloat(b.price!)
      );
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];

      if (cheapest.price === mostExpensive.price) {
        cheapestRetailerId = "same";
        cheapestRetailerName = "Same price";
        savings = 0;
        difference = "0.000";
      } else {
        cheapestRetailerId = cheapest.retailerId;
        cheapestRetailerName = cheapest.retailerName;
        savings = savingsPercentage(mostExpensive.price!, cheapest.price!);
        difference = (
          parseFloat(mostExpensive.price!) - parseFloat(cheapest.price!)
        ).toFixed(3);
      }
    }

    return {
      product,
      retailers,
      cheapestRetailerId,
      cheapestRetailerName,
      savings,
      difference,
    };
  });
}

export function getDeals(): ProductComparison[] {
  return getComparisons().filter(
    (c) =>
      c.product.prices.some((p) => p.originalPrice !== null) ||
      (c.savings !== null && c.savings >= 5)
  );
}

export function getProductById(id: string): SeedProduct | undefined {
  return SEED_PRODUCTS.find((p) => p.id === id);
}

export function getUnitPriceDisplay(
  price: string,
  sizeNormalized: number | null,
  unit: string
): string {
  if (!sizeNormalized) return "—";
  if (unit === "g" || unit === "kg") {
    return unitPrice(price, sizeNormalized, "g", "100g") + "/100g";
  }
  if (unit === "ml" || unit === "L") {
    return unitPrice(price, sizeNormalized, "ml", "L") + "/L";
  }
  return "—";
}

export function searchProducts(query: string): SeedProduct[] {
  const q = query.toLowerCase();
  return SEED_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.variant?.toLowerCase().includes(q) ?? false)
  );
}

export function getCategoryStats() {
  const categories: { id: Category; name: string; icon: string; count: number; comparableCount: number }[] = [
    { id: "tea", name: "Tea", icon: "☕", count: 0, comparableCount: 0 },
    { id: "ghee", name: "Ghee", icon: "🧈", count: 0, comparableCount: 0 },
    { id: "mustard-oil", name: "Mustard Oil", icon: "🫒", count: 0, comparableCount: 0 },
    { id: "rice", name: "Rice", icon: "🍚", count: 0, comparableCount: 0 },
    { id: "pav-bhaji-masala", name: "Pav Bhaji Masala", icon: "🌶️", count: 0, comparableCount: 0 },
  ];

  for (const cat of categories) {
    const products = getProductsByCategory(cat.id);
    cat.count = products.length;
    cat.comparableCount = products.filter(
      (p) => p.prices.length >= 2
    ).length;
  }

  return categories;
}
