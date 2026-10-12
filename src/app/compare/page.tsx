export const instant = false;

import Link from "next/link";
import { loadAllScrapedProducts } from "@/lib/scraped-data";
import { getScrapedCategoryStats } from "@/lib/scraped-data";
import { queryCanonicalProducts } from "@/lib/product-matching";
import { formatBHD } from "@/lib/price";
import { AddToGroceryButton } from "@/components/add-to-grocery";
import { CompareSearch } from "@/components/compare-search";
import { CategoryMultiSelect } from "@/components/category-multi-select";

const RETAILERS = [
  { id: "lulu", name: "LuLu", color: "text-green-700", bg: "bg-green-50" },
  { id: "aladil", name: "Al Adil", color: "text-orange-700", bg: "bg-orange-50" },
  { id: "hypermax", name: "HyperMax", color: "text-blue-700", bg: "bg-blue-50" },
] as const;

const PAGE_SIZES = [25, 50, 100];

function buildUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue;
    if (k === "retailer" && v === "all") continue;
    if (k === "page" && v === "1") continue;
    if (k === "size" && v === "25") continue;
    if (k === "sort" && v === "default") continue;
    sp.set(k, v);
  }
  const qs = sp.toString();
  return `/compare${qs ? `?${qs}` : ""}`;
}

export default async function ComparePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const catsParam = typeof searchParams.cats === "string" ? searchParams.cats : "";
  const selectedCategories = catsParam ? catsParam.split(",").filter(Boolean) : [];
  const category = typeof searchParams.category === "string" ? searchParams.category : "all";
  const retailer = typeof searchParams.retailer === "string" ? searchParams.retailer : "all";
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "default";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const rawSize = parseInt(typeof searchParams.size === "string" ? searchParams.size : "25", 10) || 25;
  const pageSize = PAGE_SIZES.includes(rawSize) ? rawSize : 25;

  const allProducts = loadAllScrapedProducts();
  const result = queryCanonicalProducts(allProducts, {
    q: q || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    category: selectedCategories.length === 0 ? category : undefined,
    retailer,
    sort,
    page,
    pageSize,
  });

  const categoryStats = getScrapedCategoryStats();
  const base = { q: q || undefined, cats: catsParam || undefined, retailer, sort, size: String(pageSize) };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-[30px] font-bold leading-[1.2] text-[#111827] mb-2">
        Compare Prices
      </h1>
      <p className="text-[#475569] mb-1">
        {result.total.toLocaleString()} products
        {result.crossRetailerCount > 0 && (
          <> &middot; <span className="text-[#087F5B] font-semibold">{result.crossRetailerCount} cross-store matches</span></>
        )}
      </p>
      <p className="text-[13px] text-[#64748B] mb-6">
        Products matched across LuLu, Al Adil and HyperMax are grouped into a single comparison row.
      </p>

      {/* Search */}
      <div className="mb-4">
        <CompareSearch
          initialQuery={q}
          category={category}
          cats={catsParam || undefined}
          retailer={retailer}
          sort={sort}
          pageSize={pageSize}
        />
      </div>

      {/* Category + Retailer + Sort + Page size */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <CategoryMultiSelect
          categories={categoryStats}
          selected={selectedCategories}
          q={q || undefined}
          retailer={retailer}
          sort={sort}
          pageSize={pageSize}
        />

        <span className="text-[#E2E8F0]">|</span>

        <div className="flex gap-1.5">
          <Link
            href={buildUrl({ ...base, retailer: "all", page: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              retailer === "all" ? "bg-[#087F5B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
            }`}
          >
            All Stores
          </Link>
          {RETAILERS.map((r) => (
            <Link
              key={r.id}
              href={buildUrl({ ...base, retailer: r.id, page: undefined })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                retailer === r.id ? "bg-[#087F5B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              {r.name}
            </Link>
          ))}
        </div>

        <span className="text-[#E2E8F0]">|</span>

        <div className="flex gap-1.5">
          {[
            { id: "default", label: "Best Matches" },
            { id: "name", label: "A–Z" },
            { id: "price-low", label: "Price ↑" },
            { id: "price-high", label: "Price ↓" },
            { id: "savings", label: "Savings" },
          ].map((s) => (
            <Link
              key={s.id}
              href={buildUrl({ ...base, sort: s.id, page: undefined })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === s.id ? "bg-[#087F5B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <span className="text-[#E2E8F0]">|</span>

        <div className="flex gap-1.5 items-center">
          <span className="text-sm text-[#64748B]">Show:</span>
          {PAGE_SIZES.map((s) => (
            <Link
              key={s}
              href={buildUrl({ ...base, size: String(s), page: undefined })}
              className={`rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${
                pageSize === s ? "bg-[#087F5B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-[13px] text-[#64748B] mb-4">
        Showing {((page - 1) * pageSize + 1).toLocaleString()}–
        {Math.min(page * pageSize, result.total).toLocaleString()} of{" "}
        {result.total.toLocaleString()} products
      </p>

      {/* Product list */}
      <div className="space-y-3">
        {result.products.map((product) => {
          const isMulti = product.listings.length > 1;

          return (
            <div
              key={product.id}
              className={`rounded-xl border bg-white p-4 ${
                isMulti ? "border-[#087F5B]/20 ring-1 ring-[#087F5B]/10" : "border-[#E2E8F0]"
              }`}
            >
              {/* Product info row */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Product details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[#111827]">
                        {product.title}
                      </p>
                      <p className="text-[13px] text-[#475569] mt-0.5">
                        {product.brand && <>{product.brand} &middot; </>}
                        {product.size && <>{product.size} &middot; </>}
                        {getCategoryName(product.category, categoryStats)}
                      </p>
                    </div>
                    {isMulti && (
                      <span className="shrink-0 rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[13px] font-semibold text-[#065F46]">
                        {product.listings.length} stores
                      </span>
                    )}
                  </div>

                  {/* Retailer price columns */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {RETAILERS.map((r) => {
                      const listing = product.listings.find(l => l.retailerId === r.id);
                      const isWinner = listing && product.cheapestRetailerId === r.id;

                      return (
                        <div
                          key={r.id}
                          className={`rounded-lg p-2.5 text-center ${
                            isWinner
                              ? "bg-[#ECFDF5] ring-1 ring-[#087F5B]/30"
                              : listing
                                ? "bg-[#F8FAFC]"
                                : "bg-[#F8FAFC]/50"
                          }`}
                        >
                          <p className={`text-[13px] font-semibold mb-1 ${r.color}`}>
                            {r.name}
                          </p>
                          {listing ? (
                            <>
                              <p className={`text-sm font-bold tabular-nums ${
                                isWinner ? "text-[#059669]" : "text-[#111827]"
                              }`}>
                                {formatBHD(listing.price.toFixed(3))}
                              </p>
                              {listing.originalPrice !== null && listing.originalPrice > listing.price && (
                                <p className="text-[13px] text-[#64748B] line-through tabular-nums">
                                  {formatBHD(listing.originalPrice.toFixed(3))}
                                </p>
                              )}
                              {isWinner && (
                                <p className="text-[11px] text-[#059669] font-semibold mt-0.5">
                                  BEST PRICE
                                </p>
                              )}
                              {listing.productUrl && (
                                <a
                                  href={listing.productUrl.startsWith("http") ? listing.productUrl : `https://gcc.luluhypermarket.com${listing.productUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#087F5B] hover:underline mt-1 inline-block"
                                >
                                  View →
                                </a>
                              )}
                            </>
                          ) : (
                            <p className="text-[13px] text-[#94A3B8] italic">
                              Not found
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Savings & actions */}
                <div className="sm:w-44 shrink-0 flex flex-col items-end gap-2">
                  {product.savings !== null && product.savings > 0 ? (
                    <div className="text-right">
                      <span className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-sm font-semibold text-[#065F46]">
                        Save {product.savings.toFixed(1)}%
                      </span>
                      <p className="mt-1 text-[13px] text-[#64748B]">
                        Cheapest at{" "}
                        {RETAILERS.find(r => r.id === product.cheapestRetailerId)?.name}
                      </p>
                      <p className="text-[13px] text-[#059669] font-medium tabular-nums">
                        {(() => {
                          const prices = product.listings.map(l => l.price);
                          const diff = Math.max(...prices) - Math.min(...prices);
                          return `Save ${formatBHD(diff.toFixed(3))}`;
                        })()}
                      </p>
                    </div>
                  ) : isMulti ? (
                    <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-sm font-medium text-[#475569]">
                      Same price
                    </span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-[13px] font-medium ${
                      RETAILERS.find(r => r.id === product.listings[0]?.retailerId)?.bg ?? "bg-[#F1F5F9]"
                    } ${
                      RETAILERS.find(r => r.id === product.listings[0]?.retailerId)?.color ?? "text-[#475569]"
                    }`}>
                      Only at {RETAILERS.find(r => r.id === product.listings[0]?.retailerId)?.name}
                    </span>
                  )}

                  <AddToGroceryButton
                    productId={product.id}
                    productTitle={product.title}
                    brand={product.brand}
                    size={product.size}
                    price={product.listings.reduce((min, l) => l.price < min ? l.price : min, product.listings[0]?.price ?? 0)}
                    originalPrice={product.listings.find(l => l.retailerId === product.cheapestRetailerId)?.originalPrice ?? null}
                    retailerId={product.cheapestRetailerId ?? product.listings[0]?.retailerId ?? ""}
                    category={product.category}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {result.products.length === 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[#475569]">No products found. Try a different search or filter.</p>
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl({ ...base, page: String(page - 1) })}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]"
            >
              ← Previous
            </Link>
          )}
          {generatePageNumbers(page, result.totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[#64748B]">...</span>
            ) : (
              <Link
                key={p}
                href={buildUrl({ ...base, page: String(p) })}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  page === p ? "bg-[#087F5B] text-white" : "border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
                }`}
              >
                {p}
              </Link>
            )
          )}
          {page < result.totalPages && (
            <Link
              href={buildUrl({ ...base, page: String(page + 1) })}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function getCategoryName(
  id: string,
  stats: { id: string; name: string }[]
): string {
  return stats.find((s) => s.id === id)?.name ?? id;
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
