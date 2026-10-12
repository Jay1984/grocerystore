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
    <Suspense fallback={<div className="px-6 py-5 lg:px-8 lg:py-6 max-w-[1200px]"><p className="text-[14px] text-[#596B62]">Loading...</p></div>}>
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
        <p className="text-[14px] text-[#596B62]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 lg:px-8 lg:py-6 max-w-[1200px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#596B62] mb-4">
        <Link href="/" className="hover:text-[#17241E]">My household</Link>
        <span className="text-[#E3EBE6]">/</span>
        <span className="text-[#17241E] font-medium">My Monthly Grocery</span>
      </div>

      {/* Search to add products */}
      <div className="mb-5">
        <GroceryListSearch monthKey={activeMonth} onItemAdded={refreshData} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#17241E]">My Monthly Grocery</h1>
          <p className="text-[14px] text-[#596B62] mt-1">
            {items.length === 0
              ? "Your list is empty. Add items from the Compare Prices page."
              : `${items.length} item${items.length !== 1 ? "s" : ""} · ${items.reduce((s, i) => s + i.quantity, 0)} total units · BHD ${totalCost.toFixed(3)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/compare"
            className="flex items-center gap-2 rounded-lg bg-[#087F5B] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B4F] transition-colors"
          >
            + Add items
          </Link>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="rounded-lg border border-[#E3EBE6] px-4 py-2 text-[13px] font-medium text-[#596B62] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
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
                ? "bg-[#087F5B] text-white"
                : "bg-white border border-[#E3EBE6] text-[#596B62] hover:bg-[#F5FAF7]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E3EBE6] bg-white p-12 text-center">
          <span className="text-5xl mb-4 block">🛒</span>
          <p className="text-[16px] font-semibold text-[#17241E] mb-2">Nothing here yet</p>
          <p className="text-[14px] text-[#596B62] mb-4">
            Browse products and tap &ldquo;+ Monthly Grocery&rdquo; to start building your list.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg bg-[#087F5B] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#006B4F] transition-colors"
          >
            Compare Prices →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E3EBE6] bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E3EBE6] text-[12px] font-medium text-[#596B62] uppercase tracking-wider">
                <th className="px-5 py-3">Item</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Subtotal</th>
                <th className="px-3 py-3 text-right">Added</th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EBE6]">
              {items.map((item) => {
                const itemPrice = getItemPrice(item);
                return (
                  <tr key={item.productId} className="hover:bg-[#F5FAF7]/50">
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-medium text-[#17241E] truncate max-w-[300px]">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-[#596B62]">
                        {[item.brand, item.size].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {itemPrice != null ? (
                        <>
                          <span className="text-[13px] font-semibold text-[#17241E] tabular-nums">
                            {formatBHD(itemPrice.toFixed(3))}
                          </span>
                          {item.originalPrice && item.originalPrice > itemPrice && (
                            <span className="ml-1 text-[11px] text-[#596B62] line-through tabular-nums">
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
                          className="h-7 w-7 rounded border border-[#E3EBE6] text-[#596B62] hover:bg-[#F5FAF7] text-sm font-semibold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[14px] font-semibold text-[#17241E] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          className="h-7 w-7 rounded border border-[#E3EBE6] text-[#596B62] hover:bg-[#F5FAF7] text-sm font-semibold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] font-semibold text-[#17241E] tabular-nums">
                      {itemPrice != null ? formatBHD((itemPrice * item.quantity).toFixed(3)) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] text-[#596B62]">
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
                          className="text-[#596B62] hover:text-red-500 transition-colors p-1.5"
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
              <tr className="border-t border-[#E3EBE6] bg-[#F5FAF7]/50">
                <td colSpan={3} className="px-5 py-3 text-[13px] font-semibold text-[#17241E]">
                  Total
                </td>
                <td className="px-3 py-3 text-right text-[14px] font-bold text-[#17241E] tabular-nums">
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
