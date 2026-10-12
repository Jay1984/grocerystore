"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

export interface BrandStatItem {
  brand: string;
  count: number;
}

interface Props {
  brands: BrandStatItem[];
  selected: string[];
  q?: string;
  cats?: string;
  retailer: string;
  sort: string;
  pageSize: number;
}

function buildUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "all" && v !== "1" && !(k === "size" && v === "25") && !(k === "sort" && v === "default")) {
      sp.set(k, v);
    }
  }
  const qs = sp.toString();
  return `/compare${qs ? `?${qs}` : ""}`;
}

export function BrandMultiSelect({ brands, selected, q, cats, retailer, sort, pageSize }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set(selected));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPending(new Set(selected));
  }, [selected]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) => b.brand.toLowerCase().includes(q));
  }, [brands, search]);

  const toggleBrand = useCallback((brand: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }, []);

  const applyFilters = useCallback(() => {
    const brandsParam = [...pending].length > 0 ? [...pending].join(",") : undefined;
    router.push(
      buildUrl({
        q: q || undefined,
        cats: cats || undefined,
        brands: brandsParam,
        retailer,
        sort,
        size: String(pageSize),
      })
    );
    setOpen(false);
    setSearch("");
  }, [pending, q, cats, retailer, sort, pageSize, router]);

  const clearAll = useCallback(() => setPending(new Set()), []);

  const selectAll = useCallback(() => {
    setPending(new Set(brands.map((b) => b.brand)));
  }, [brands]);

  const label =
    selected.length === 0
      ? "All Brands"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} Brands Selected`;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          selected.length > 0
            ? "border-[var(--color-teal-accent)] bg-[var(--color-teal-light)] text-[var(--color-teal-accent)]"
            : "border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)]"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M4 2h8l-3 5v5l-2 1V7L4 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[340px] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-xl">
          {/* Search */}
          <div className="border-b border-[var(--color-border-light)] p-2">
            <input
              type="text"
              placeholder="Search brands…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-light)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-teal-accent)] focus:ring-1 focus:ring-[var(--color-teal-accent)]"
              autoFocus
            />
          </div>

          {/* Select All / Clear */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-3 py-1.5">
            <button onClick={selectAll} className="text-[13px] font-medium text-[var(--color-teal-accent)] hover:underline">
              Select All
            </button>
            <button onClick={clearAll} className="text-[13px] font-medium text-[var(--color-text-secondary)] hover:underline">
              Clear
            </button>
          </div>

          {/* Brand list */}
          <div className="max-h-[360px] overflow-y-auto p-1">
            {filtered.map((b) => (
              <div key={b.brand} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--color-teal-light)]">
                <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={pending.has(b.brand)}
                    onChange={() => toggleBrand(b.brand)}
                    className="h-4 w-4 rounded border-[var(--color-border-light)] text-[var(--color-teal-accent)] focus:ring-[var(--color-teal-accent)] accent-[var(--color-teal-accent)] shrink-0"
                  />
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{b.brand}</span>
                  <span className="ml-auto text-[12px] text-[var(--color-text-secondary)] tabular-nums shrink-0">
                    {b.count.toLocaleString()}
                  </span>
                </label>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-[var(--color-text-secondary)]">
                No brands match &ldquo;{search}&rdquo;
              </p>
            )}
          </div>

          {/* Apply */}
          <div className="border-t border-[var(--color-border-light)] p-2">
            <button
              onClick={applyFilters}
              className="w-full rounded-lg bg-[var(--color-teal-accent)] py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-accent)] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
