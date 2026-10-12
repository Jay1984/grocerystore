const STORAGE_KEY = "favorites";

export interface FavoriteItem {
  productId: string;
  title: string;
  brand: string | null;
  size: string | null;
  category: string;
  addedAt: string;
}

function load(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: FavoriteItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function getFavorites(): FavoriteItem[] {
  return load();
}

export function isFavorite(productId: string): boolean {
  return load().some((f) => f.productId === productId);
}

export function addFavorite(
  item: Omit<FavoriteItem, "addedAt">
): FavoriteItem {
  const items = load();
  const existing = items.find((f) => f.productId === item.productId);
  if (existing) return existing;
  const newItem: FavoriteItem = { ...item, addedAt: new Date().toISOString() };
  items.unshift(newItem);
  save(items);
  return newItem;
}

export function removeFavorite(productId: string): void {
  const items = load().filter((f) => f.productId !== productId);
  save(items);
}

export function getFavoriteCount(): number {
  return load().length;
}

export function clearFavorites(): void {
  save([]);
}
