"use client";

import { useState, useMemo, useCallback } from "react";
import { SEED_PRODUCTS, RETAILERS, type SeedProduct } from "@/lib/seed-data";
import { BasketSearch } from "@/components/basket-search";
import { formatBHD } from "@/lib/price";
import Decimal from "decimal.js";

interface BasketEntry {
  product: SeedProduct;
  quantity: number;
}

export default function BasketPage() {
  const [basket, setBasket] = useState<BasketEntry[]>([]);

  const addToBasket = useCallback((product: SeedProduct) => {
    setBasket((prev) => {
      const existing = prev.find((e) => e.product.id === product.id);
      if (existing) {
        return prev.map((e) =>
          e.product.id === product.id
            ? { ...e, quantity: e.quantity + 1 }
            : e
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((e) =>
          e.product.id === productId
            ? { ...e, quantity: e.quantity + delta }
            : e
        )
        .filter((e) => e.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setBasket((prev) => prev.filter((e) => e.product.id !== productId));
  };

  const totals = useMemo(() => {
    const retailerTotals = RETAILERS.map((r) => {
      let total = new Decimal(0);
      let missing = 0;
      for (const entry of basket) {
        const found = entry.product.prices.find((p) => p.retailer === r.id);
        if (found) {
          total = total.plus(new Decimal(found.price).times(entry.quantity));
        } else {
          missing++;
        }
      }
      return { ...r, total: total.toFixed(3), missing };
    });

    let optimizedTotal = new Decimal(0);
    const optimizedPlan: { product: SeedProduct; retailer: string; price: string; quantity: number }[] = [];

    for (const entry of basket) {
      const available = entry.product.prices.map((p) => ({
        retailerName: RETAILERS.find((r) => r.id === p.retailer)?.name ?? p.retailer,
        price: p.price,
      }));

      if (available.length > 0) {
        const cheapest = available.reduce((a, b) =>
          parseFloat(a.price) <= parseFloat(b.price) ? a : b
        );
        optimizedTotal = optimizedTotal.plus(
          new Decimal(cheapest.price).times(entry.quantity)
        );
        optimizedPlan.push({
          product: entry.product,
          retailer: cheapest.retailerName,
          price: cheapest.price,
          quantity: entry.quantity,
        });
      }
    }

    const bestSingleStore = retailerTotals
      .filter((r) => r.missing === 0 && parseFloat(r.total) > 0)
      .sort((a, b) => parseFloat(a.total) - parseFloat(b.total))[0];

    const savings = bestSingleStore
      ? new Decimal(bestSingleStore.total).minus(optimizedTotal).toFixed(3)
      : "0.000";

    return { retailerTotals, optimizedTotal: optimizedTotal.toFixed(3), optimizedPlan, savings };
  }, [basket]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-[30px] font-bold leading-[1.2] text-[#111827] mb-2">
        My Basket
      </h1>
      <p className="text-[#475569] mb-6">
        Build your shopping list and find the cheapest way to buy everything
      </p>

      <div className="mb-6">
        <BasketSearch onAddProduct={addToBasket} />
      </div>

      {basket.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-[#475569]">
            Your basket is empty. Search for products to add them.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {basket.map((entry) => (
              <div
                key={entry.product.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#111827] truncate">
                    {entry.product.name}
                  </p>
                  <p className="text-[13px] text-[#475569]">
                    {entry.product.brand} &middot; {entry.product.size}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[13px] text-[#64748B]">
                    {entry.product.prices.map((p) => (
                      <span key={p.retailer} className="tabular-nums">
                        {RETAILERS.find((r) => r.id === p.retailer)?.name ?? p.retailer}:{" "}
                        {formatBHD(p.price)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(entry.product.id, -1)}
                    className="h-8 w-8 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] flex items-center justify-center font-semibold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold text-[#111827]">
                    {entry.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(entry.product.id, 1)}
                    className="h-8 w-8 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] flex items-center justify-center font-semibold"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(entry.product.id)}
                  className="text-[#64748B] hover:text-red-500 text-sm"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
                Basket Summary
              </h3>
              <div className="space-y-3">
                {totals.retailerTotals.map((r) => (
                  <SummaryRow
                    key={r.id}
                    label={`${r.name} Total`}
                    value={r.total}
                    missing={r.missing}
                  />
                ))}
                <div className="border-t border-[#E2E8F0] pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-[#087F5B]">
                      Optimized (best of each)
                    </span>
                    <span className="text-[20px] font-bold text-[#087F5B] tabular-nums">
                      {formatBHD(totals.optimizedTotal)}
                    </span>
                  </div>
                  {parseFloat(totals.savings) > 0 && (
                    <p className="text-[13px] text-[#059669] mt-1">
                      Save {formatBHD(totals.savings)} vs single store
                    </p>
                  )}
                </div>
              </div>
            </div>

            {totals.optimizedPlan.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
                  Optimized Plan
                </h3>
                <div className="space-y-2">
                  {totals.optimizedPlan.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-[#475569] truncate flex-1 mr-2">
                        {item.product.name}{" "}
                        {item.quantity > 1 && `x${item.quantity}`}
                      </span>
                      <span className="text-[#64748B] shrink-0">
                        {item.retailer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing: number;
}) {
  return (
    <div className="flex justify-between items-baseline">
      <div>
        <span className="text-sm text-[#475569]">{label}</span>
        {missing > 0 && (
          <span className="ml-1 text-[13px] text-amber-600">
            ({missing} missing)
          </span>
        )}
      </div>
      <span className="font-semibold text-[#111827] tabular-nums">{formatBHD(value)}</span>
    </div>
  );
}
