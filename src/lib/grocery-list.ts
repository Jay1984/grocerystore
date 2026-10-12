export const STORAGE_KEY = "grocery-list";

export interface GroceryItem {
  productId: string;
  title: string;
  brand: string | null;
  size: string | null;
  quantity: number;
  addedAt: string;
  price: number;
  originalPrice: number | null;
  retailerId: string;
  category: string;
}

export function loadGroceryList(): GroceryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGroceryList(items: GroceryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}
