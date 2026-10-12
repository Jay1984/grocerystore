"use client";

import { useState } from "react";
import { SEED_PRODUCTS, RETAILERS } from "@/lib/seed-data";
import { CATEGORIES, type Category } from "@/types";
import { formatBHD } from "@/lib/price";

const BAR_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
};

export default function TrendsPage() {
  const [category, setCategory] = useState<Category | "all">("all");

  const products =
    category === "all"
      ? SEED_PRODUCTS.filter((p) => p.prices.length >= 2)
      : SEED_PRODUCTS.filter(
          (p) => p.category === category && p.prices.length >= 2
        );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-[30px] font-bold leading-[1.2] text-[#111827] mb-2">
        Price Trends
      </h1>
      <p className="text-[#475569] mb-6">
        Track how prices compare across retailers over time.
        Historical tracking will begin once the scraper runs regularly.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategory("all")}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            category === "all"
              ? "bg-[#087F5B] text-white"
              : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              category === cat.id
                ? "bg-[#087F5B] text-white"
                : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Price history charts will populate once
          the automated scraper begins collecting data over time. Currently
          showing the initial price snapshot from all retailers.
        </p>
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const retailerPrices = RETAILERS.map((r) => {
            const found = product.prices.find((p) => p.retailer === r.id);
            return {
              ...r,
              val: found ? parseFloat(found.price) : null,
            };
          }).filter((r) => r.val !== null);

          const maxPrice = Math.max(...retailerPrices.map((r) => r.val!));
          const minPrice = Math.min(...retailerPrices.map((r) => r.val!));

          return (
            <div
              key={product.id}
              className="rounded-xl border border-[#E2E8F0] bg-white p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#111827]">
                    {product.name}
                  </p>
                  <p className="text-[13px] text-[#475569]">
                    {product.brand} &middot; {product.size}
                  </p>
                </div>
                <div className="sm:w-96 space-y-2">
                  {retailerPrices.map((r) => (
                    <PriceBar
                      key={r.id}
                      label={r.name}
                      price={r.val!}
                      max={maxPrice}
                      color={BAR_COLORS[r.color] ?? "bg-gray-500"}
                      isLower={r.val === minPrice && retailerPrices.length > 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-[#64748B]">
          No comparable products in this category.
        </div>
      )}
    </div>
  );
}

function PriceBar({
  label,
  price,
  max,
  color,
  isLower,
}: {
  label: string;
  price: number;
  max: number;
  color: string;
  isLower: boolean;
}) {
  const pct = max > 0 ? (price / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-[#64748B] w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} ${
            isLower ? "opacity-100" : "opacity-60"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[13px] font-semibold w-20 text-right tabular-nums ${
          isLower ? "text-[#059669]" : "text-[#475569]"
        }`}
      >
        {formatBHD(price.toFixed(3))}
      </span>
    </div>
  );
}
