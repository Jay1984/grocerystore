"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatBHD } from "@/lib/price";
import { type GroceryItem, loadGroceryList, saveGroceryList } from "@/lib/grocery-list";
import { GroceryListSearch } from "@/components/grocery-list-search";

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadGroceryList());
    setMounted(true);
  }, []);

  const persist = useCallback((next: GroceryItem[]) => {
    setItems(next);
    saveGroceryList(next);
  }, []);

  function updateQty(productId: string, delta: number) {
    const next = items
      .map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + delta } : i
      )
      .filter((i) => i.quantity > 0);
    persist(next);
  }

  function remove(productId: string) {
    persist(items.filter((i) => i.productId !== productId));
  }

  function clearAll() {
    persist([]);
  }

  const totalCost = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);

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
        <GroceryListSearch onItemAdded={() => setItems(loadGroceryList())} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
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
              onClick={clearAll}
              className="rounded-lg border border-[#E3EBE6] px-4 py-2 text-[13px] font-medium text-[#596B62] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
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
              {items.map((item) => (
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
                    <span className="text-[13px] font-semibold text-[#17241E] tabular-nums">
                      {item.price ? formatBHD(item.price.toFixed(3)) : "—"}
                    </span>
                    {item.originalPrice && item.price && item.originalPrice > item.price && (
                      <span className="ml-1 text-[11px] text-[#596B62] line-through tabular-nums">
                        {formatBHD(item.originalPrice.toFixed(3))}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="h-7 w-7 rounded border border-[#E3EBE6] text-[#596B62] hover:bg-[#F5FAF7] text-sm font-semibold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-[14px] font-semibold text-[#17241E] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="h-7 w-7 rounded border border-[#E3EBE6] text-[#596B62] hover:bg-[#F5FAF7] text-sm font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] font-semibold text-[#17241E] tabular-nums">
                    {item.price ? formatBHD((item.price * item.quantity).toFixed(3)) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-[#596B62]">
                    {new Date(item.addedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => remove(item.productId)}
                      className="text-[#596B62] hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
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
