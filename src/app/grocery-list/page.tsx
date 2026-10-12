"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatBHD } from "@/lib/price";
import {
  type GroceryItem,
  type GroceryList,
  getAllLists,
  getListForMonth,
  getOrCreateList,
  updateItemQty,
  removeItem,
  clearList,
  getCurrentMonthKey,
  getMonthLabel,
} from "@/lib/grocery-list";
import { GroceryListSearch } from "@/components/grocery-list-search";
import { FavoriteButton } from "@/components/favorite-button";

interface PriceInfo {
  price: number;
  originalPrice: number | null;
  retailerId: string;
}

export default function GroceryListPageWrapper() {
  return (
    <Suspense fallback={<div className="px-6 py-5 lg:px-8 lg:py-6 max-w-[1200px]"><p className="text-[14px] text-[var(--color-text-secondary)]">Loading...</p></div>}>
      <GroceryListPage />
    </Suspense>
  );
}

function GroceryListPage() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const [activeMonth, setActiveMonth] = useState(monthParam || getCurrentMonthKey());
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const [mounted, setMounted] = useState(false);

  const refreshData = useCallback(() => {
    const allLists = getAllLists();
    setLists(allLists);
    const list = getListForMonth(activeMonth);
    const currentItems = list?.items || [];
    setItems(currentItems);

    if (currentItems.length > 0) {
      const ids = currentItems.map((i) => i.productId).join(",");
      fetch(`/api/products/prices?ids=${encodeURIComponent(ids)}`)
        .then((r) => r.json())
        .then((data) => setPrices(data.prices || {}))
        .catch(() => {});
    } else {
      setPrices({});
    }
  }, [activeMonth]);

  useEffect(() => {
    refreshData();
    setMounted(true);
  }, [refreshData]);

  useEffect(() => {
    if (monthParam && monthParam !== activeMonth) {
      setActiveMonth(monthParam);
    }
  }, [monthParam, activeMonth]);

  function handleUpdateQty(productId: string, delta: number) {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(productId, activeMonth);
    } else {
      updateItemQty(productId, newQty, activeMonth);
    }
    refreshData();
  }

  function handleRemove(productId: string) {
    removeItem(productId, activeMonth);
    refreshData();
  }

  function handleClearAll() {
    clearList(activeMonth);
    refreshData();
  }

  function getItemPrice(item: GroceryItem): number | null {
    const live = prices[item.productId];
    if (live) return live.price;
    if (item.price > 0) return item.price;
    return null;
  }

  const totalCost = items.reduce((sum, i) => {
    const p = getItemPrice(i);
    return sum + (p ?? 0) * i.quantity;
  }, 0);

  const monthTabs = lists.length > 0
    ? lists.map((l) => ({ key: l.id, label: l.month }))
    : [{ key: getCurrentMonthKey(), label: getMonthLabel(getCurrentMonthKey()) }];

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
        <span className="text-[var(--color-text-primary)] font-medium">My Monthly Grocery</span>
      </div>

      {/* Search to add products */}
      <div className="mb-5">
        <GroceryListSearch monthKey={activeMonth} onItemAdded={refreshData} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--color-text-primary)]">My Monthly Grocery</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            {items.length === 0
              ? "Your list is empty. Add items from the Compare Prices page."
              : `${items.length} item${items.length !== 1 ? "s" : ""} · ${items.reduce((s, i) => s + i.quantity, 0)} total units · BHD ${totalCost.toFixed(3)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/compare"
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-teal-accent)] transition-colors"
          >
            + Add items
          </Link>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="rounded-lg border border-[var(--color-border-light)] px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Month tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto">
        {monthTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveMonth(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeMonth === tab.key
                ? "bg-[var(--color-teal-accent)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-12 text-center">
          <span className="text-5xl mb-4 block">🛒</span>
          <p className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-2">Nothing here yet</p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mb-4">
            Browse products and tap &ldquo;+ Monthly Grocery&rdquo; to start building your list.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-accent)] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[var(--color-teal-accent)] transition-colors"
          >
            Compare Prices →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-light)] text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                <th className="px-5 py-3">Item</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Subtotal</th>
                <th className="px-3 py-3 text-right">Added</th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {items.map((item) => {
                const itemPrice = getItemPrice(item);
                return (
                  <tr key={item.productId} className="hover:bg-[var(--color-teal-light)]/50">
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate max-w-[300px]">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">
                        {[item.brand, item.size].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {itemPrice != null ? (
                        <>
                          <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
                            {formatBHD(itemPrice.toFixed(3))}
                          </span>
                          {item.originalPrice && item.originalPrice > itemPrice && (
                            <span className="ml-1 text-[11px] text-[var(--color-text-secondary)] line-through tabular-nums">
                              {formatBHD(item.originalPrice.toFixed(3))}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-block rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                          Price unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          className="h-7 w-7 rounded border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)] text-sm font-semibold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[14px] font-semibold text-[var(--color-text-primary)] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          className="h-7 w-7 rounded border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)] text-sm font-semibold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
                      {itemPrice != null ? formatBHD((itemPrice * item.quantity).toFixed(3)) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-[var(--color-text-secondary)]">
                      {new Date(item.addedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <FavoriteButton
                          productId={item.productId}
                          productTitle={item.title}
                          brand={item.brand}
                          size={item.size}
                          category={item.category}
                        />
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors p-1.5"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--color-border-light)] bg-[var(--color-teal-light)]/50">
                <td colSpan={3} className="px-5 py-3 text-[13px] font-semibold text-[var(--color-text-primary)]">
                  Total
                </td>
                <td className="px-3 py-3 text-right text-[14px] font-bold text-[var(--color-text-primary)] tabular-nums">
                  BHD {totalCost.toFixed(3)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
