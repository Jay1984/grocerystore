"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatBHD } from "@/lib/price";
import { type GroceryItem, getListForMonth, getCurrentMonthKey } from "@/lib/grocery-list";
import { DashboardSearch } from "./dashboard-search";
import { FavoriteButton } from "./favorite-button";
import { useFavorites } from "./favorites-provider";

interface RetailerInfo {
  id: string;
  name: string;
}

interface DealProduct {
  id: string;
  title: string;
  brand: string | null;
  size: string | null;
  price: number;
  originalPrice: number | null;
  retailerId: string;
  category: string;
}

interface CategoryStat {
  id: string;
  icon: string;
}

interface Props {
  retailers: RetailerInfo[];
  bestDeals: DealProduct[];
  categoryStats: CategoryStat[];
}

export function DashboardStats({ retailers, bestDeals, categoryStats }: Props) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const { count: favoriteCount } = useFavorites();

  useEffect(() => {
    setItems(getListForMonth(getCurrentMonthKey())?.items || []);
    setMounted(true);
  }, []);

  const totalSpending = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const totalSaved = items.reduce((sum, i) => {
    if (i.originalPrice && i.price && i.originalPrice > i.price) {
      return sum + (i.originalPrice - i.price) * i.quantity;
    }
    return sum;
  }, 0);
  const discountedCount = items.filter(
    (i) => i.originalPrice && i.price && i.originalPrice > i.price
  ).length;
  const totalItems = items.length;

  const retailerSpending = retailers.map((r) => {
    const total = items
      .filter((i) => i.retailerId === r.id)
      .reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
    return { ...r, spending: total };
  }).sort((a, b) => b.spending - a.spending);
  const maxSpending = Math.max(...retailerSpending.map((r) => r.spending), 1);

  const recentItems = [...items]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  function getCategoryIcon(id: string): string {
    return categoryStats.find((s) => s.id === id)?.icon || "📦";
  }

  return (
    <div className="px-6 py-5 lg:px-8 lg:py-6 max-w-[1200px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] mb-4">
        <span>My household</span>
        <span className="text-[var(--color-border-light)]">/</span>
        <span className="text-[var(--color-text-primary)] font-medium">Overview</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Your Monthly Snapshot
          </p>
          <h1 className="text-[28px] font-bold leading-[1.2] text-[var(--color-text-primary)]">
            A little smarter. A lot more saved.
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
            Your groceries, your savings, and a few good finds for home.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-text-primary)]">
            <CalendarIcon />
            <span className="font-medium">October 2026</span>
            <ChevronDownIcon />
          </div>
          <Link
            href="/compare"
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-teal-accent)] transition-colors"
          >
            <PlusIcon />
            Add purchase
          </Link>
        </div>
      </div>

      {/* Global Search */}
      <div className="mb-5">
        <DashboardSearch />
      </div>

      {/* Disclaimer */}
      <p className="text-[12px] text-[var(--color-text-secondary)] mb-5 flex items-center gap-1.5">
        <InfoIcon />
        Based on your grocery list. Prices and offers are from verified retailer listings.
      </p>

      {/* Three Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Saved */}
        <div className="rounded-2xl bg-gradient-to-br from-[#087F5B] to-[#006B4F] p-5 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-[var(--color-surface)]/5 -mr-6 -mt-6" />
          <div className="absolute right-4 bottom-4 w-16 h-16 rounded-full bg-[var(--color-surface)]/5" />
          <p className="text-[13px] font-medium text-white/80 mb-1">Total saved this month</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-white/60">BHD</span>
            <span className="text-[32px] font-bold leading-none tabular-nums">
              {mounted ? totalSaved.toFixed(3) : "—"}
            </span>
          </div>
          {mounted && totalItems > 0 && (
            <p className="mt-3 text-[12px] text-white/70">
              From {discountedCount} discounted item{discountedCount !== 1 ? "s" : ""} in your list
            </p>
          )}
          {mounted && totalItems === 0 && (
            <p className="mt-3 text-[12px] text-white/70">
              Add items from Compare Prices to start saving
            </p>
          )}
          <div className="absolute top-4 right-4">
            <PiggyBankIcon />
          </div>
        </div>

        {/* Card 2: Grocery Spending */}
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Planned grocery cost</p>
            <CartIcon />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] text-[var(--color-text-secondary)]">BHD</span>
            <span className="text-[28px] font-bold text-[var(--color-text-primary)] tabular-nums leading-none">
              {mounted ? totalSpending.toFixed(3) : "—"}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
            {mounted && totalItems > 0
              ? `${totalItems} item${totalItems !== 1 ? "s" : ""} in your grocery list`
              : "No items in your list yet"}
          </p>
        </div>

        {/* Card 3: Discounted Items */}
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Discounted items</p>
            <DiscountIcon />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[var(--color-text-primary)] leading-none">
              {mounted ? discountedCount : "—"}
            </span>
            {mounted && totalItems > 0 && (
              <span className="text-[14px] text-[var(--color-text-secondary)]">/ {totalItems} items</span>
            )}
          </div>
          <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
            {mounted && discountedCount > 0 ? (
              <span className="flex items-center gap-1">
                {retailers.map((r, i) => (
                  <span
                    key={r.id}
                    className={`h-2 w-2 rounded-full ${
                      items.some((it) => it.retailerId === r.id && it.originalPrice && it.originalPrice > it.price)
                        ? "bg-[var(--color-teal-accent)]"
                        : "bg-[var(--color-border-light)]"
                    }`}
                  />
                ))}
                <span className="ml-1">On your grocery list</span>
              </span>
            ) : (
              "Add discounted items to see savings"
            )}
          </p>
        </div>

        {/* Card 4: Favorites */}
        <Link href="/favorites" className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-teal-accent)]/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Saved favorites</p>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[28px] font-bold text-[var(--color-text-primary)] leading-none">
            {mounted ? favoriteCount : "—"}
          </span>
          <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
            {mounted && favoriteCount > 0
              ? "Products you're watching"
              : "Tap ❤️ on products to save them"}
          </p>
        </Link>
      </div>

      {/* Spending by Store + Where You Saved */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Spending breakdown */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                Your grocery spending
              </h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                How your list breaks down by store.
              </p>
            </div>
          </div>

          {mounted && totalItems > 0 ? (
            <div className="mt-4 space-y-3">
              {retailerSpending.filter((r) => r.spending > 0).map((r) => {
                const pct = maxSpending > 0 ? (r.spending / maxSpending) * 100 : 0;
                const color = r.id === "lulu" ? "bg-[var(--color-teal-accent)]" : r.id === "aladil" ? "bg-[#F59E0B]" : "bg-[#0EA5E9]";
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className={`shrink-0 text-[12px] font-semibold rounded px-1.5 py-0.5 ${
                      r.id === "lulu" ? "bg-[var(--color-teal-light)] text-[var(--color-teal-accent)]"
                        : r.id === "aladil" ? "bg-[#FEF3C7] text-[#92400E]"
                          : "bg-[#E0F2FE] text-[#0369A1]"
                    }`}>
                      {r.id === "lulu" ? "LuLu" : r.id === "aladil" ? "Al" : "HM"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{r.name}</p>
                      <div className="mt-1 h-2 rounded-full bg-[var(--color-teal-light)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums shrink-0">
                      BHD {r.spending.toFixed(3)}
                    </span>
                  </div>
                );
              })}
              {retailerSpending.every((r) => r.spending === 0) && (
                <p className="text-[13px] text-[var(--color-text-secondary)] py-4 text-center">
                  No spending data yet. Add items from Compare Prices.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 py-8 text-center">
              <span className="text-3xl mb-2 block">🛒</span>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Add items to your grocery list to see spending breakdown.
              </p>
              <Link
                href="/compare"
                className="inline-block mt-3 text-[13px] font-medium text-[var(--color-teal-accent)] hover:text-[var(--color-teal-accent)]"
              >
                Compare Prices →
              </Link>
            </div>
          )}
        </div>

        {/* Savings per store */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Where you saved</h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">Savings from discounted items.</p>
            </div>
            <StoreIcon />
          </div>

          {mounted && discountedCount > 0 ? (
            <div className="mt-4 space-y-3">
              {retailers.map((r) => {
                const saved = items
                  .filter((i) => i.retailerId === r.id && i.originalPrice && i.originalPrice > i.price)
                  .reduce((sum, i) => sum + (i.originalPrice! - i.price) * i.quantity, 0);
                if (saved === 0) return null;
                const maxSaved = Math.max(
                  ...retailers.map((ret) =>
                    items
                      .filter((i) => i.retailerId === ret.id && i.originalPrice && i.originalPrice > i.price)
                      .reduce((sum, i) => sum + (i.originalPrice! - i.price) * i.quantity, 0)
                  ),
                  1
                );
                const pct = (saved / maxSaved) * 100;
                const color = r.id === "lulu" ? "bg-[var(--color-teal-accent)]" : r.id === "aladil" ? "bg-[#F59E0B]" : "bg-[#0EA5E9]";
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className={`shrink-0 text-[12px] font-semibold rounded px-1.5 py-0.5 ${
                      r.id === "lulu" ? "bg-[var(--color-teal-light)] text-[var(--color-teal-accent)]"
                        : r.id === "aladil" ? "bg-[#FEF3C7] text-[#92400E]"
                          : "bg-[#E0F2FE] text-[#0369A1]"
                    }`}>
                      {r.id === "lulu" ? "LuLu" : r.id === "aladil" ? "Al" : "HM"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{r.name}</p>
                      <div className="mt-1 h-2 rounded-full bg-[var(--color-teal-light)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums shrink-0">
                      BHD {saved.toFixed(3)}
                    </span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          ) : (
            <div className="mt-4 py-6 text-center">
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                {mounted ? "No discounted items in your list yet." : "Loading..."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recently in Your Grocery List */}
      <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
              Recently in your grocery list
            </h2>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Items you&apos;ve added to your monthly list.
            </p>
          </div>
          <Link
            href="/grocery-list"
            className="text-[13px] font-medium text-[var(--color-teal-accent)] hover:text-[var(--color-teal-accent)] mt-2 sm:mt-0"
          >
            View full list →
          </Link>
        </div>

        {mounted && recentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border-light)] text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  <th className="px-5 py-3">Item</th>
                  <th className="px-3 py-3">Store</th>
                  <th className="px-3 py-3">Added</th>
                  <th className="px-3 py-3 text-right">Price / Unit</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {recentItems.map((item) => {
                  const retailer = retailers.find((r) => r.id === item.retailerId);
                  const saved = item.originalPrice && item.price && item.originalPrice > item.price
                    ? item.originalPrice - item.price
                    : 0;

                  return (
                    <tr key={item.productId} className="hover:bg-[var(--color-teal-light)]/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[var(--color-teal-light)] flex items-center justify-center text-[16px] shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-secondary)]">
                              {[item.brand, item.size].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          item.retailerId === "lulu"
                            ? "bg-[var(--color-teal-light)] text-[var(--color-teal-accent)]"
                            : item.retailerId === "aladil"
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-[#E0F2FE] text-[#0369A1]"
                        }`}>
                          {retailer?.name || item.retailerId}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[var(--color-text-secondary)]">
                        {new Date(item.addedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
                          {item.price ? formatBHD(item.price.toFixed(3)) : "—"}
                        </span>
                        {item.originalPrice && item.price && item.originalPrice > item.price && (
                          <span className="ml-1 text-[11px] text-[var(--color-text-secondary)] line-through tabular-nums">
                            {formatBHD(item.originalPrice.toFixed(3))}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-[13px] text-[var(--color-text-primary)] tabular-nums">
                        ×{item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {saved > 0 ? (
                          <span className="inline-block rounded-full bg-[var(--color-teal-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-teal-accent)]">
                            Save {formatBHD(saved.toFixed(3))}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[var(--color-text-secondary)]">Regular</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <span className="text-3xl mb-2 block">📋</span>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              {mounted
                ? "Your grocery list is empty. Add items from Compare Prices."
                : "Loading..."}
            </p>
            {mounted && (
              <Link
                href="/compare"
                className="inline-block mt-3 text-[13px] font-medium text-[var(--color-teal-accent)] hover:text-[var(--color-teal-accent)]"
              >
                Compare Prices →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recommended Products */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                A few good finds for your home
              </h2>
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#92400E] uppercase">
                Curated for you
              </span>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Pantry staples and family favourites, for a little less.
            </p>
          </div>
          <Link
            href="/deals"
            className="text-[13px] font-medium text-[var(--color-teal-accent)] hover:text-[var(--color-teal-accent)] flex items-center gap-1"
          >
            Explore offers <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bestDeals.map((product) => {
            const retailer = retailers.find((r) => r.id === product.retailerId);
            const saved = product.originalPrice
              ? product.originalPrice - product.price
              : 0;

            return (
              <div
                key={product.id}
                className="group rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-[160px] bg-gradient-to-b from-[var(--color-teal-light)] to-[var(--color-page-bg)] flex items-center justify-center">
                  <span className="text-5xl">
                    {getCategoryIcon(product.category)}
                  </span>
                  <div className="absolute top-3 right-3">
                    <FavoriteButton
                      productId={product.id}
                      productTitle={product.title}
                      brand={product.brand}
                      size={product.size}
                      category={product.category}
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      product.retailerId === "lulu"
                        ? "bg-[var(--color-teal-light)] text-[var(--color-teal-accent)]"
                        : product.retailerId === "aladil"
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : "bg-[#E0F2FE] text-[#0369A1]"
                    }`}>
                      {retailer?.name}
                    </span>
                    {saved > 0 && (
                      <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold bg-[var(--color-teal-light)] text-[var(--color-teal-accent)]">
                        Special offer
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate">
                    {product.title}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5 truncate">
                    {product.brand ? `${product.brand} · ` : ""}
                    {product.size || ""}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[16px] font-bold text-[var(--color-text-primary)] tabular-nums">
                      BHD {product.price.toFixed(3)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[13px] text-[var(--color-text-secondary)] line-through tabular-nums">
                        {product.originalPrice.toFixed(3)}
                      </span>
                    )}
                  </div>
                  {saved > 0 && (
                    <p className="mt-1 text-[12px] font-medium text-[var(--color-teal-accent)]">
                      Save {formatBHD(saved.toFixed(3))}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Festival Banner */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border border-[#EAB84D]/20 mb-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 p-6 md:p-8">
            <p className="text-[11px] font-semibold text-[#92400E] uppercase tracking-wider mb-2">
              A Little Festival Planning
            </p>
            <h2 className="text-[24px] font-bold text-[var(--color-text-primary)] leading-[1.2] mb-2">
              More joy. Less spending.
            </h2>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-4">
              Build around the moments that matter. Get your pantry
              ready for sweets, shared meals, and good company.
            </p>
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 rounded-lg bg-[#EAB84D] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[#D4A43A] transition-colors"
            >
              Plan for Diwali →
            </Link>
          </div>
          <div className="md:w-[280px] h-[180px] md:h-auto flex items-center justify-center p-4">
            <div className="text-6xl">🪔🍬🎆</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--color-text-secondary)] pb-4">
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-teal-accent)]" />
        A smarter basket, a happier home.
        <span className="mx-2 text-[var(--color-border-light)]">|</span>
        All prices in BHD. Source data.
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function PiggyBankIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" /><path d="M2 9v1c0 1.1.9 2 2 2h1" /><path d="M16 11h0" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function DiscountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 3.1 3.8 4.9-.3-.3 4.9L23.5 12l-3.8 3.1.3 4.9-4.9-.3L12 23.5 8.9 19.7l-4.9.3.3-4.9L.5 12l3.8-3.6-.3-4.9 4.9.3z" /><line x1="9" y1="15" x2="15" y2="9" /><line x1="9.5" y1="9.5" x2="9.51" y2="9.5" /><line x1="14.5" y1="14.5" x2="14.51" y2="14.5" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
