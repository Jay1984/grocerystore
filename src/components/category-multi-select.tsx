"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface SubCategoryStat {
  id: string;
  name: string;
  count: number;
}

interface CategoryStatItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  children: SubCategoryStat[];
}

interface Props {
  categories: CategoryStatItem[];
  selected: string[];
  q?: string;
  brands?: string;
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

export function CategoryMultiSelect({ categories, selected, q, brands, retailer, sort, pageSize }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(cat => {
      if (cat.name.toLowerCase().includes(q)) return true;
      return cat.children.some(sub => sub.name.toLowerCase().includes(q));
    });
  }, [categories, search]);

  const toggleParent = useCallback((catId: string, children: SubCategoryStat[]) => {
    setPending(prev => {
      const next = new Set(prev);
      const childIds = children.map(c => c.id);
      const allSelected = [catId, ...childIds].every(id => next.has(id));
      if (allSelected) {
        next.delete(catId);
        childIds.forEach(id => next.delete(id));
      } else {
        next.add(catId);
        childIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, []);

  const toggleChild = useCallback((subId: string, parentId: string, siblings: SubCategoryStat[]) => {
    setPending(prev => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
        next.delete(parentId);
      } else {
        next.add(subId);
        const siblingIds = siblings.map(s => s.id);
        if (siblingIds.every(id => id === subId || next.has(id))) {
          next.add(parentId);
        }
      }
      return next;
    });
  }, []);

  const applyFilters = useCallback(() => {
    const cats = [...pending];
    const catParam = cats.length > 0 ? cats.join(",") : undefined;
    router.push(buildUrl({ q: q || undefined, cats: catParam, brands, retailer, sort, size: String(pageSize) }));
    setOpen(false);
    setSearch("");
  }, [pending, q, retailer, sort, pageSize, router]);

  const clearAll = useCallback(() => {
    setPending(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set<string>();
    for (const cat of categories) {
      all.add(cat.id);
      for (const sub of cat.children) all.add(sub.id);
    }
    setPending(all);
  }, [categories]);

  const getParentCheckState = (catId: string, children: SubCategoryStat[]): "checked" | "indeterminate" | "unchecked" => {
    if (children.length === 0) return pending.has(catId) ? "checked" : "unchecked";
    const childIds = children.map(c => c.id);
    const checkedCount = childIds.filter(id => pending.has(id)).length;
    if (pending.has(catId) && checkedCount === childIds.length) return "checked";
    if (checkedCount > 0 || pending.has(catId)) return "indeterminate";
    return "unchecked";
  };

  const parentCount = useMemo(() => {
    const parentIds = new Set(categories.map(c => c.id));
    return selected.filter(id => parentIds.has(id)).length || (selected.length > 0 ? selected.length : 0);
  }, [selected, categories]);

  const label = selected.length === 0
    ? "All Categories"
    : `${parentCount} ${parentCount === 1 ? "Category" : "Categories"} Selected`;

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
          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[340px] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-xl">
          {/* Search */}
          <div className="border-b border-[var(--color-border-light)] p-2">
            <input
              type="text"
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
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

          {/* Category list */}
          <div className="max-h-[360px] overflow-y-auto p-1">
            {filtered.map(cat => {
              const isExpanded = expanded.has(cat.id) || search.length > 0;
              const checkState = getParentCheckState(cat.id, cat.children);
              const hasChildren = cat.children.length > 0;

              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-[var(--color-teal-light)]">
                    {hasChildren ? (
                      <button
                        onClick={() => setExpanded(prev => {
                          const next = new Set(prev);
                          next.has(cat.id) ? next.delete(cat.id) : next.add(cat.id);
                          return next;
                        })}
                        className="w-5 h-5 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                          <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : (
                      <span className="w-5" />
                    )}
                    <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={checkState === "checked"}
                        ref={el => { if (el) el.indeterminate = checkState === "indeterminate"; }}
                        onChange={() => toggleParent(cat.id, cat.children)}
                        className="h-4 w-4 rounded border-[var(--color-border-light)] text-[var(--color-teal-accent)] focus:ring-[var(--color-teal-accent)] accent-[var(--color-teal-accent)] shrink-0"
                      />
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{cat.name}</span>
                      <span className="ml-auto text-[12px] text-[var(--color-text-secondary)] tabular-nums shrink-0">{cat.count.toLocaleString()}</span>
                    </label>
                  </div>

                  {isExpanded && hasChildren && (
                    <div className="ml-7">
                      {cat.children
                        .filter(sub => !search || sub.name.toLowerCase().includes(search.toLowerCase()))
                        .map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--color-teal-light)]">
                            <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={pending.has(sub.id)}
                                onChange={() => toggleChild(sub.id, cat.id, cat.children)}
                                className="h-3.5 w-3.5 rounded border-[var(--color-border-light)] text-[var(--color-teal-accent)] focus:ring-[var(--color-teal-accent)] accent-[var(--color-teal-accent)] shrink-0"
                              />
                              <span className="text-[13px] text-[var(--color-text-secondary)] truncate">{sub.name}</span>
                              <span className="ml-auto text-[12px] text-[var(--color-text-secondary)] tabular-nums shrink-0">{sub.count.toLocaleString()}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-[var(--color-text-secondary)]">No categories match "{search}"</p>
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
