"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useFavorites } from "@/components/favorites-provider";
import { FavoriteButton } from "@/components/favorite-button";
import { AddToGroceryButton } from "@/components/add-to-grocery";
import { formatBHD } from "@/lib/price";

const RETAILERS = [
  { id: "lulu", name: "LuLu" },
  { id: "aladil", name: "Al Adil" },
  { id: "hypermax", name: "HyperMax" },
] as const;

interface RetailerListing {
  retailerId: string;
  price: number;
  originalPrice: number | null;
  title: string;
  productUrl: string;
  imageUrl: string | null;
}

interface ProductDetail {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  size: string | null;
  listings: RetailerListing[];
  cheapestRetailerId: string | null;
  savings: number | null;
}

type SortKey = "name" | "price-low" | "savings" | "recent";

export default function FavoritesPage() {
  const { favorites, count } = useFavorites();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mounted, setMounted] = useState(false);

  const fetchDetails = useCallback(() => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const ids = favorites.map((f) => f.productId).join(",");
    setLoading(true);
    fetch(`/api/products/details?ids=${encodeURIComponent(ids)}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favorites]);

  useEffect(() => {
    setMounted(true);
    fetchDetails();
  }, [fetchDetails]);

  const categories = useMemo(() => {
    const cats = new Set(favorites.map((f) => f.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [favorites]);

  const filtered = useMemo(() => {
    let items = favorites;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.brand && f.brand.toLowerCase().includes(q))
      );
    }

    if (categoryFilter) {
      items = items.filter((f) => f.category === categoryFilter);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const enriched = items.map((f) => ({
      favorite: f,
      detail: productMap.get(f.productId) ?? null,
    }));

    enriched.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.favorite.title.localeCompare(b.favorite.title);
        case "price-low": {
          const pa = a.detail?.listings.reduce((m, l) => Math.min(m, l.price), Infinity) ?? Infinity;
          const pb = b.detail?.listings.reduce((m, l) => Math.min(m, l.price), Infinity) ?? Infinity;
          return pa - pb;
        }
        case "savings": {
          const sa = a.detail?.savings ?? 0;
          const sb = b.detail?.savings ?? 0;
          return sb - sa;
        }
        case "recent":
        default:
          return new Date(b.favorite.addedAt).getTime() - new Date(a.favorite.addedAt).getTime();
      }
    });

    return enriched;
  }, [favorites, products, search, categoryFilter, sortBy]);

  if (!mounted) {
    return (
      <div className="px-6 py-5 lg:px-8 lg:py-6 max-w-[1200px]">
        <p className="text-[14px] text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 lg:px-8 lg:py-6 max-w-[1200px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] mb-4">
        <Link href="/" className="hover:text-[var(--color-text-primary)]">My household</Link>
        <span className="text-[var(--color-border-light)]">/</span>
        <span className="text-[var(--color-text-primary)] font-medium">My Favorites</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--color-text-primary)]">My Favorites</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            {count === 0
              ? "No favorites yet. Tap the heart icon on any product to save it."
              : `${count} saved product${count !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/compare"
          className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-teal-accent)] transition-colors shrink-0"
        >
          Browse Products
        </Link>
      </div>

      {/* Filters */}
      {count > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)] px-3 py-2 flex-1 min-w-[200px] max-w-[400px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search favorites…"
              className="flex-1 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] bg-transparent outline-none min-w-0"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] shrink-0"
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-text-primary)] outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-text-primary)] outline-none"
          >
            <option value="recent">Recently Favorited</option>
            <option value="name">Product Name</option>
            <option value="price-low">Lowest Price</option>
            <option value="savings">Highest Savings</option>
          </select>
        </div>
      )}

      {/* Results */}
      {loading && count > 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[14px] text-[var(--color-text-secondary)]">Loading prices...</p>
        </div>
      ) : filtered.length === 0 && count > 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-2">No matches</p>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            No favorites match your search or filters.
          </p>
        </div>
      ) : count === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-12 text-center">
          <span className="text-5xl mb-4 block">❤️</span>
          <p className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-2">No favorites yet</p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mb-4">
            Browse products and tap the heart icon to save them here.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-accent)] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[var(--color-teal-accent)] transition-colors"
          >
            Compare Prices →
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border-light)] text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  <th className="px-5 py-3">Product</th>
                  {RETAILERS.map((r) => (
                    <th key={r.id} className="px-3 py-3 text-center">{r.name}</th>
                  ))}
                  <th className="px-3 py-3 text-right">Lowest</th>
                  <th className="px-3 py-3 text-right">Savings</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {filtered.map(({ favorite, detail }) => {
                  const lowestPrice = detail?.listings.reduce(
                    (m, l) => Math.min(m, l.price),
                    Infinity
                  );
                  return (
                    <tr key={favorite.productId} className="hover:bg-[var(--color-teal-light)]/50">
                      <td className="px-5 py-3">
                        <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate max-w-[280px]">
                          {favorite.title}
                        </p>
                        <p className="text-[12px] text-[var(--color-text-secondary)]">
                          {[favorite.brand, favorite.size].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>
                      {RETAILERS.map((r) => {
                        const listing = detail?.listings.find((l) => l.retailerId === r.id);
                        const isLowest = listing && detail?.cheapestRetailerId === r.id;
                        return (
                          <td key={r.id} className="px-3 py-3 text-center">
                            {listing ? (
                              <span className={`text-[13px] font-semibold tabular-nums ${isLowest ? "text-[var(--color-teal-accent)]" : "text-[var(--color-text-primary)]"}`}>
                                {formatBHD(listing.price.toFixed(3))}
                              </span>
                            ) : (
                              <span className="text-[12px] text-[var(--color-text-secondary)]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right">
                        {lowestPrice != null && lowestPrice < Infinity ? (
                          <span className="text-[13px] font-bold text-[var(--color-text-primary)] tabular-nums">
                            {formatBHD(lowestPrice.toFixed(3))}
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                            Price unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {detail?.savings != null && detail.savings > 0 ? (
                          <span className="rounded-full bg-[var(--color-teal-light)] px-2 py-0.5 text-[12px] font-semibold text-[var(--color-teal-accent)]">
                            {detail.savings.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[12px] text-[var(--color-text-secondary)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <FavoriteButton
                            productId={favorite.productId}
                            productTitle={favorite.title}
                            brand={favorite.brand}
                            size={favorite.size}
                            category={favorite.category}
                          />
                          <AddToGroceryButton
                            productId={favorite.productId}
                            productTitle={favorite.title}
                            brand={favorite.brand}
                            size={favorite.size}
                            price={lowestPrice != null && lowestPrice < Infinity ? lowestPrice : 0}
                            originalPrice={null}
                            retailerId={detail?.cheapestRetailerId ?? ""}
                            category={favorite.category}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map(({ favorite, detail }) => {
              const lowestPrice = detail?.listings.reduce(
                (m, l) => Math.min(m, l.price),
                Infinity
              );
              return (
                <div
                  key={favorite.productId}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {favorite.title}
                      </p>
                      <p className="text-[13px] text-[var(--color-text-secondary)]">
                        {[favorite.brand, favorite.size].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <FavoriteButton
                        productId={favorite.productId}
                        productTitle={favorite.title}
                        brand={favorite.brand}
                        size={favorite.size}
                        category={favorite.category}
                      />
                    </div>
                  </div>

                  {/* Retailer prices */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {RETAILERS.map((r) => {
                      const listing = detail?.listings.find((l) => l.retailerId === r.id);
                      const isLowest = listing && detail?.cheapestRetailerId === r.id;
                      return (
                        <div
                          key={r.id}
                          className={`rounded-lg p-2 text-center ${
                            isLowest ? "bg-[var(--color-teal-light)] ring-1 ring-[var(--color-teal-accent)]/30" : "bg-[var(--color-teal-light)]"
                          }`}
                        >
                          <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">{r.name}</p>
                          {listing ? (
                            <p className={`text-[13px] font-bold tabular-nums ${isLowest ? "text-[var(--color-teal-accent)]" : "text-[var(--color-text-primary)]"}`}>
                              {formatBHD(listing.price.toFixed(3))}
                            </p>
                          ) : (
                            <p className="text-[12px] text-[var(--color-text-secondary)]">—</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      {detail?.savings != null && detail.savings > 0 && (
                        <span className="rounded-full bg-[var(--color-teal-light)] px-2 py-0.5 text-[12px] font-semibold text-[var(--color-teal-accent)]">
                          Save {detail.savings.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <AddToGroceryButton
                      productId={favorite.productId}
                      productTitle={favorite.title}
                      brand={favorite.brand}
                      size={favorite.size}
                      price={lowestPrice != null && lowestPrice < Infinity ? lowestPrice : 0}
                      originalPrice={null}
                      retailerId={detail?.cheapestRetailerId ?? ""}
                      category={favorite.category}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
