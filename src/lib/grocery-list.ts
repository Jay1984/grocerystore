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

export interface GroceryList {
  id: string;
  month: string;
  items: GroceryItem[];
  createdAt: string;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function loadRaw(): GroceryList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && !("items" in parsed[0])) {
      const key = currentMonthKey();
      return [{ id: key, month: monthLabel(key), items: parsed as GroceryItem[], createdAt: new Date().toISOString() }];
    }
    return parsed as GroceryList[];
  } catch {
    return [];
  }
}

function saveAll(lists: GroceryList[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {}
}

export function getAllLists(): GroceryList[] {
  return loadRaw();
}

export function getListForMonth(monthKey?: string): GroceryList | null {
  const key = monthKey || currentMonthKey();
  return loadRaw().find((l) => l.id === key) || null;
}

export function getOrCreateList(monthKey?: string): GroceryList {
  const key = monthKey || currentMonthKey();
  const lists = loadRaw();
  let list = lists.find((l) => l.id === key);
  if (!list) {
    list = { id: key, month: monthLabel(key), items: [], createdAt: new Date().toISOString() };
    lists.push(list);
    saveAll(lists);
  }
  return list;
}

export function addItemToList(item: Omit<GroceryItem, "addedAt">, monthKey?: string): { action: "added" | "updated"; item: GroceryItem } {
  const key = monthKey || currentMonthKey();
  const lists = loadRaw();
  let list = lists.find((l) => l.id === key);
  if (!list) {
    list = { id: key, month: monthLabel(key), items: [], createdAt: new Date().toISOString() };
    lists.push(list);
  }
  const existing = list.items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
    saveAll(lists);
    return { action: "updated", item: existing };
  }
  const newItem: GroceryItem = { ...item, addedAt: new Date().toISOString() };
  list.items.push(newItem);
  saveAll(lists);
  return { action: "added", item: newItem };
}

export function findItemInList(productId: string, monthKey?: string): GroceryItem | null {
  const key = monthKey || currentMonthKey();
  const list = loadRaw().find((l) => l.id === key);
  return list?.items.find((i) => i.productId === productId) || null;
}

export function updateItemQty(productId: string, quantity: number, monthKey?: string) {
  const key = monthKey || currentMonthKey();
  const lists = loadRaw();
  const list = lists.find((l) => l.id === key);
  if (!list) return;
  if (quantity <= 0) {
    list.items = list.items.filter((i) => i.productId !== productId);
  } else {
    const item = list.items.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  saveAll(lists);
}

export function removeItem(productId: string, monthKey?: string) {
  const key = monthKey || currentMonthKey();
  const lists = loadRaw();
  const list = lists.find((l) => l.id === key);
  if (!list) return;
  list.items = list.items.filter((i) => i.productId !== productId);
  saveAll(lists);
}

export function clearList(monthKey?: string) {
  const key = monthKey || currentMonthKey();
  const lists = loadRaw();
  const list = lists.find((l) => l.id === key);
  if (list) {
    list.items = [];
    saveAll(lists);
  }
}

export function getTotalItemCount(): number {
  return loadRaw().reduce((sum, list) => sum + list.items.length, 0);
}

export function getCurrentMonthKey(): string {
  return currentMonthKey();
}

export function getMonthLabel(key: string): string {
  return monthLabel(key);
}
