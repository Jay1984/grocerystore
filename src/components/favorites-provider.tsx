"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite as checkFavorite,
  type FavoriteItem,
} from "@/lib/favorites";

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  toggle: (item: Omit<FavoriteItem, "addedAt">) => "added" | "removed";
  isFavorite: (productId: string) => boolean;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  toggle: () => "added",
  isFavorite: () => false,
  count: 0,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);

    function onStorage(e: StorageEvent) {
      if (e.key === "favorites") refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const toggle = useCallback(
    (item: Omit<FavoriteItem, "addedAt">): "added" | "removed" => {
      if (checkFavorite(item.productId)) {
        removeFavorite(item.productId);
        refresh();
        return "removed";
      }
      addFavorite(item);
      refresh();
      return "added";
    },
    [refresh]
  );

  const isFav = useCallback(
    (productId: string) => {
      if (!mounted) return false;
      return favorites.some((f) => f.productId === productId);
    },
    [favorites, mounted]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggle, isFavorite: isFav, count: favorites.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
