import { RETAILERS } from "@/lib/seed-data";
import { getScrapedCategoryStats, getScrapedDeals } from "@/lib/scraped-data";
import { DashboardStats } from "@/components/dashboard-stats";

export default function HomePage() {
  const categoryStats = getScrapedCategoryStats();
  const deals = getScrapedDeals();

  const bestDeals = deals
    .filter((d) => d.originalPrice && d.originalPrice > d.price)
    .sort((a, b) => {
      const da = a.originalPrice! - a.price;
      const db = b.originalPrice! - b.price;
      return db - da;
    })
    .slice(0, 3)
    .map((d) => ({
      id: d.id,
      title: d.title,
      brand: d.brand,
      size: d.size,
      price: d.price,
      originalPrice: d.originalPrice,
      retailerId: d.retailerId,
      category: d.category,
    }));

  const retailers = RETAILERS.map((r) => ({ id: r.id, name: r.name }));

  const cats = categoryStats.map((c) => ({ id: c.id, icon: c.icon }));

  return (
    <DashboardStats
      retailers={retailers}
      bestDeals={bestDeals}
      categoryStats={cats}
    />
  );
}
