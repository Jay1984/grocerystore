export const instant = false;

import Link from "next/link";
import { loadAllScrapedProducts } from "@/lib/scraped-data";
import { getScrapedCategoryStats } from "@/lib/scraped-data";
import { queryCanonicalProducts, getBrandFacets } from "@/lib/product-matching";
import { getDescendantIds } from "@/lib/categories";
import { formatBHD } from "@/lib/price";
import { AddToGroceryButton } from "@/components/add-to-grocery";
import { FavoriteButton } from "@/components/favorite-button";
import { CompareSearch } from "@/components/compare-search";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { BrandMultiSelect } from "@/components/brand-multi-select";

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
  const brandsParam = typeof searchParams.brands === "string" ? searchParams.brands : "";
  const selectedBrands = brandsParam ? brandsParam.split(",").filter(Boolean) : [];
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "default";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const rawSize = parseInt(typeof searchParams.size === "string" ? searchParams.size : "25", 10) || 25;
  const pageSize = PAGE_SIZES.includes(rawSize) ? rawSize : 25;

  const allProducts = loadAllScrapedProducts();

  // Compute brand facets from products filtered by everything except brands
  const brandFacets = getBrandFacets(
    allProducts.filter((p) => {
      if (selectedCategories.length > 0) {
        const allIds = new Set<string>();
        for (const cid of selectedCategories) {
          for (const did of getDescendantIds(cid)) allIds.add(did);
        }
        if (!allIds.has(p.category)) return false;
      } else if (category && category !== "all") {
        const ids = new Set(getDescendantIds(category));
        if (!ids.has(p.category)) return false;
      }
      if (retailer && retailer !== "all" && p.retailerId !== retailer) return false;
      if (q) {
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        const haystack = `${p.title} ${p.brand || ""} ${p.category} ${p.size || ""}`.toLowerCase();
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      return true;
    })
  );

  // Validate selected brands against available facets
  const availableBrandNames = new Set(brandFacets.map((f) => f.brand));
  const validBrands = selectedBrands.filter((b) => availableBrandNames.has(b));

  const result = queryCanonicalProducts(allProducts, {
    q: q || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    category: selectedCategories.length === 0 ? category : undefined,
    retailer,
    brands: validBrands.length > 0 ? validBrands : undefined,
    sort,
    page,
    pageSize,
  });

  const categoryStats = getScrapedCategoryStats();
  const base = { q: q || undefined, cats: catsParam || undefined, brands: validBrands.length > 0 ? validBrands.join(",") : undefined, retailer, sort, size: String(pageSize) };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-[30px] font-bold leading-[1.2] text-[var(--color-text-primary)] mb-2">
        Compare Prices
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-1">
        {result.total.toLocaleString()} products
        {result.crossRetailerCount > 0 && (
          <> &middot; <span className="text-[var(--color-teal-accent)] font-semibold">{result.crossRetailerCount} cross-store matches</span></>
        )}
      </p>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-6">
        Products matched across LuLu, Al Adil and HyperMax are grouped into a single comparison row.
      </p>

      {/* Search */}
      <div className="mb-4">
        <CompareSearch
          initialQuery={q}
          category={category}
          cats={catsParam || undefined}
          brands={validBrands.length > 0 ? validBrands.join(",") : undefined}
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
          brands={validBrands.length > 0 ? validBrands.join(",") : undefined}
          retailer={retailer}
          sort={sort}
          pageSize={pageSize}
        />

        <BrandMultiSelect
          brands={brandFacets}
          selected={validBrands}
          q={q || undefined}
          cats={catsParam || undefined}
          retailer={retailer}
          sort={sort}
          pageSize={pageSize}
        />

        <span className="text-[var(--color-border-light)]">|</span>

        <div className="flex gap-1.5">
          <Link
            href={buildUrl({ ...base, retailer: "all", page: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              retailer === "all" ? "bg-[var(--color-teal-accent)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
            }`}
          >
            All Stores
          </Link>
          {RETAILERS.map((r) => (
            <Link
              key={r.id}
              href={buildUrl({ ...base, retailer: r.id, page: undefined })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                retailer === r.id ? "bg-[var(--color-teal-accent)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
              }`}
            >
              {r.name}
            </Link>
          ))}
        </div>

        <span className="text-[var(--color-border-light)]">|</span>

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
                sort === s.id ? "bg-[var(--color-teal-accent)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <span className="text-[var(--color-border-light)]">|</span>

        <div className="flex gap-1.5 items-center">
          <span className="text-sm text-[var(--color-text-muted)]">Show:</span>
          {PAGE_SIZES.map((s) => (
            <Link
              key={s}
              href={buildUrl({ ...base, size: String(s), page: undefined })}
              className={`rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${
                pageSize === s ? "bg-[var(--color-teal-accent)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Selected brand chips */}
      {validBrands.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {validBrands.map((brand) => (
            <Link
              key={brand}
              href={buildUrl({
                ...base,
                brands: validBrands.filter((b) => b !== brand).join(",") || undefined,
                page: undefined,
              })}
              className="flex items-center gap-1 rounded-full bg-[var(--color-teal-light)] border border-[var(--color-teal-accent)]/20 px-2.5 py-1 text-[13px] font-medium text-[var(--color-teal-accent)] hover:bg-[var(--color-badge-savings-bg)] transition-colors"
            >
              {brand}
              <span className="text-[var(--color-teal-accent)]/60 ml-0.5">✕</span>
            </Link>
          ))}
          <Link
            href={buildUrl({ ...base, brands: undefined, page: undefined })}
            className="rounded-full border border-[var(--color-border-light)] px-2.5 py-1 text-[13px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-teal-light)] transition-colors"
          >
            Clear brands
          </Link>
        </div>
      )}

      {/* Clear all filters */}
      {(q || selectedCategories.length > 0 || validBrands.length > 0 || retailer !== "all" || sort !== "default") && (
        <div className="mb-3">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Clear all filters
          </Link>
        </div>
      )}

      {/* Result count */}
      <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
        Showing {((page - 1) * pageSize + 1).toLocaleString()}–
        {Math.min(page * pageSize, result.total).toLocaleString()} of{" "}
        {result.total.toLocaleString()} products
      </p>

      {/* Product list */}
      <div className="space-y-4">
        {result.products.map((product) => {
          const isMulti = product.listings.length > 1;
          const lowestPrice = product.listings.reduce((min, l) => l.price < min ? l.price : min, product.listings[0]?.price ?? 0);
          const highestPrice = product.listings.reduce((max, l) => l.price > max ? l.price : max, 0);
          const savingsAmount = isMulti ? highestPrice - lowestPrice : 0;
          const cheapestName = RETAILERS.find(r => r.id === product.cheapestRetailerId)?.name;
          const mostExpensiveName = RETAILERS.find(r => r.id === product.listings.find(l => l.price === highestPrice)?.retailerId)?.name;
          const storeCount = product.listings.length;

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] px-5 py-5 sm:px-6"
            >
              {/* Header: title + heart */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-semibold text-[var(--color-text-primary)] leading-snug">
                    {product.title}
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                    {product.size && <>{product.size} &middot; </>}
                    {getCategoryName(product.category, categoryStats)}
                    {" "}&middot; {storeCount} of {RETAILERS.length} stores
                  </p>
                </div>
                <div className="shrink-0 mt-0.5">
                  <FavoriteButton
                    productId={product.id}
                    productTitle={product.title}
                    brand={product.brand}
                    size={product.size}
                    category={product.category}
                    className="h-10 w-10 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] !p-0 flex items-center justify-center hover:border-[var(--color-text-muted)]"
                  />
                </div>
              </div>

              {/* Retailer price grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {RETAILERS.map((r) => {
                  const listing = product.listings.find(l => l.retailerId === r.id);
                  const isLowest = listing && product.cheapestRetailerId === r.id;
                  const diff = listing && lowestPrice > 0 ? listing.price - lowestPrice : 0;

                  if (!listing) {
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-page-bg)] px-4 py-3"
                      >
                        <p className={`text-[13px] font-semibold ${r.color}`}>{r.name}</p>
                        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Not stocked</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl border px-4 py-3 ${
                        isLowest
                          ? "border-[var(--color-text-primary)] border-[1.5px]"
                          : "border-[var(--color-border-light)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[13px] font-semibold ${r.color}`}>{r.name}</span>
                        <div className="flex items-center gap-2">
                          {diff > 0.0005 && (
                            <span className="text-[12px] font-medium text-[var(--color-text-muted)] tabular-nums">
                              +{diff.toFixed(3)}
                            </span>
                          )}
                          {isLowest && (
                            <span className="rounded-full bg-[var(--color-text-primary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-page-bg)]">
                              Lowest
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[18px] font-bold text-[var(--color-text-primary)] tabular-nums leading-tight">
                        <span className="text-[13px] font-semibold text-[var(--color-text-muted)] mr-0.5">BHD</span>
                        {listing.price.toFixed(3)}
                      </p>
                      {listing.productUrl && (
                        <a
                          href={listing.productUrl.startsWith("http") ? listing.productUrl : `https://gcc.luluhypermarket.com${listing.productUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-[var(--color-teal-accent)] hover:underline mt-1.5 inline-block"
                        >
                          View at store →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer: savings + add to monthly list */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  {savingsAmount > 0.0005 ? (
                    <>Save BHD {savingsAmount.toFixed(3)} at {cheapestName} vs {mostExpensiveName}</>
                  ) : isMulti ? (
                    <>Same price across stores</>
                  ) : (
                    <>Only at {RETAILERS.find(r => r.id === product.listings[0]?.retailerId)?.name}</>
                  )}
                </p>
                <AddToGroceryButton
                  productId={product.id}
                  productTitle={product.title}
                  brand={product.brand}
                  size={product.size}
                  price={lowestPrice}
                  originalPrice={product.listings.find(l => l.retailerId === product.cheapestRetailerId)?.originalPrice ?? null}
                  retailerId={product.cheapestRetailerId ?? product.listings[0]?.retailerId ?? ""}
                  category={product.category}
                />
              </div>
            </div>
          );
        })}
      </div>

      {result.products.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[var(--color-text-secondary)]">No products found. Try a different search or filter.</p>
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl({ ...base, page: String(page - 1) })}
              className="rounded-lg border border-[var(--color-border-light)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
            >
              ← Previous
            </Link>
          )}
          {generatePageNumbers(page, result.totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[var(--color-text-muted)]">...</span>
            ) : (
              <Link
                key={p}
                href={buildUrl({ ...base, page: String(p) })}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  page === p ? "bg-[var(--color-teal-accent)] text-white" : "border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
                }`}
              >
                {p}
              </Link>
            )
          )}
          {page < result.totalPages && (
            <Link
              href={buildUrl({ ...base, page: String(page + 1) })}
              className="rounded-lg border border-[var(--color-border-light)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
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
