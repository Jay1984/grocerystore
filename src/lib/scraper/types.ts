export interface ScrapedProduct {
  retailerProductId: string;
  title: string;
  brand: string | null;
  price: number;
  originalPrice: number | null;
  categoryPath: string;
  productUrl: string;
  imageUrl: string | null;
  availability: "in_stock" | "out_of_stock";
  size: string | null;
}

export interface ScrapedCategory {
  id: string;
  name: string;
  url: string;
  parentId: string | null;
}

export interface RetailerAdapter {
  retailerSlug: string;
  discoverCategories(): AsyncGenerator<ScrapedCategory>;
  scrapeCategory(category: ScrapedCategory): AsyncGenerator<ScrapedProduct>;
}
