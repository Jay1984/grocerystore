"use client";

import { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import type { SearchSuggestion } from "@/lib/search-suggestions";

interface Props {
  initialQuery?: string;
  category?: string;
  retailer?: string;
  onSearch?: (query: string) => void;
  onCategorySelect?: (categoryId: string) => void;
  onBrandSelect?: (brand: string) => void;
  onProductSelect?: (productId: string) => void;
  placeholder?: string;
  className?: string;
  restrictTypes?: SearchSuggestion["type"][];
}

const TYPE_LABELS: Record<string, string> = {
  product: "Product",
  brand: "Brand",
  category: "Category",
  query: "Search",
};

const GROCERY_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' rx='8' fill='%23F0FDF4'/%3E%3Ctext x='22' y='28' text-anchor='middle' font-size='20'%3E🛒%3C/text%3E%3C/svg%3E";

export function SearchAutocomplete({
  initialQuery = "",
  category,
  retailer,
  onSearch,
  onCategorySelect,
  onBrandSelect,
  onProductSelect,
  placeholder = "Search products by name, brand, category…",
  className = "",
  restrictTypes,
}: Props) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    suggestions: rawSuggestions,
    loading,
    open,
    setOpen,
    activeIndex,
    setActiveIndex,
    close,
    handleKeyDown: hookKeyDown,
  } = useSearchSuggestions({ category, retailer });

  const suggestions = restrictTypes
    ? rawSuggestions.filter((s) => restrictTypes.includes(s.type))
    : rawSuggestions;

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [close]);

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      close();
      switch (suggestion.type) {
        case "product":
          if (onProductSelect) {
            onProductSelect(suggestion.id);
          } else {
            const params = new URLSearchParams({ q: suggestion.label });
            router.push(`/compare?${params}`);
          }
          break;
        case "category":
          if (onCategorySelect && suggestion.categoryId) {
            onCategorySelect(suggestion.categoryId);
          } else {
            router.push(`/compare?category=${suggestion.categoryId}`);
          }
          break;
        case "brand":
          if (onBrandSelect && suggestion.brandName) {
            onBrandSelect(suggestion.brandName);
          } else {
            const params = new URLSearchParams({ q: suggestion.brandName || suggestion.label });
            router.push(`/compare?${params}`);
          }
          break;
        case "query":
          if (onSearch) {
            onSearch(suggestion.label);
          } else {
            const params = new URLSearchParams({ q: suggestion.label });
            router.push(`/compare?${params}`);
          }
          break;
      }
    },
    [close, onProductSelect, onCategorySelect, onBrandSelect, onSearch, router]
  );

  const handleViewAll = useCallback(() => {
    close();
    if (onSearch) {
      onSearch(query);
    } else {
      const params = new URLSearchParams({ q: query });
      router.push(`/compare?${params}`);
    }
  }, [close, onSearch, query, router]);

  function handleKeyDown(e: React.KeyboardEvent) {
    hookKeyDown(e);
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectSuggestion(suggestions[activeIndex]);
      } else if (activeIndex === suggestions.length) {
        handleViewAll();
      } else if (query.trim()) {
        handleViewAll();
      }
    }
  }

  function highlightMatch(text: string): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#DDF5E8] text-[#087F5B] rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  function getImage(s: SearchSuggestion): string | null {
    if (s.type === "product" && s.imageUrl) return s.imageUrl;
    return null;
  }

  function getFallbackIcon(s: SearchSuggestion): string {
    if (s.icon) return s.icon;
    if (s.type === "brand") return "🏷️";
    if (s.type === "category") return "📂";
    if (s.type === "query") return "🔍";
    return "🛒";
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`} role="combobox" aria-expanded={open} aria-haspopup="listbox">
      <div className="flex items-center gap-2.5 rounded-xl border border-[#E3EBE6] bg-white px-4 py-3 focus-within:border-[#087F5B] focus-within:ring-2 focus-within:ring-[#087F5B]/15 transition-colors">
        <SearchIcon />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2 && suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-[14px] text-[#17241E] placeholder:text-[#596B62] bg-transparent outline-none min-w-0"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          role="searchbox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          autoComplete="off"
        />
        {loading && (
          <span className="h-4 w-4 border-2 border-[#E3EBE6] border-t-[#087F5B] rounded-full animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              close();
              inputRef.current?.focus();
            }}
            className="text-[#596B62] hover:text-[#17241E] shrink-0 p-0.5"
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-[#E3EBE6] bg-white shadow-xl shadow-black/8 max-h-[480px] overflow-y-auto"
        >
          <ul className="py-1.5">
            {suggestions.map((s, i) => {
              const imgSrc = getImage(s);
              return (
                <li
                  key={s.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`px-3 py-3 cursor-pointer flex items-center gap-3 transition-colors min-h-[64px] ${
                    i === activeIndex ? "bg-[#F5FAF7]" : "hover:bg-[#FAFCFB]"
                  }`}
                  onClick={() => selectSuggestion(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {/* Image / Icon */}
                  <div className="h-[44px] w-[44px] rounded-lg bg-[#F5FAF7] flex items-center justify-center shrink-0 overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = GROCERY_PLACEHOLDER;
                        }}
                      />
                    ) : (
                      <span className="text-[20px] leading-none">{getFallbackIcon(s)}</span>
                    )}
                  </div>
                  {/* Name + size */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[14px] font-medium text-[#17241E] line-clamp-2"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {highlightMatch(s.label)}
                    </p>
                    {s.subtitle && (
                      <p className="text-[12px] text-[#596B62] mt-0.5 truncate">{s.subtitle}</p>
                    )}
                  </div>
                  {/* Price + meta */}
                  <div className="shrink-0 flex items-center gap-2">
                    {s.price !== undefined && (
                      <span
                        className="text-[14px] font-semibold text-[#17241E] tabular-nums whitespace-nowrap"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        BHD {s.price.toFixed(3)}
                      </span>
                    )}
                    {s.retailerCount !== undefined && s.retailerCount > 1 && (
                      <span className="text-[11px] font-medium text-[#087F5B] bg-[#DDF5E8] rounded-md px-1.5 py-0.5 whitespace-nowrap">
                        {s.retailerCount} stores
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-[#596B62] bg-[#F5FAF7] rounded-md px-1.5 py-0.5 uppercase tracking-wide whitespace-nowrap">
                      {TYPE_LABELS[s.type] || s.type}
                    </span>
                  </div>
                </li>
              );
            })}

            {/* View all results */}
            <li
              role="option"
              aria-selected={activeIndex === suggestions.length}
              className={`px-3 py-3 cursor-pointer flex items-center gap-3 border-t border-[#E3EBE6] transition-colors min-h-[52px] ${
                activeIndex === suggestions.length ? "bg-[#F5FAF7]" : "hover:bg-[#FAFCFB]"
              }`}
              onClick={handleViewAll}
              onMouseEnter={() => setActiveIndex(suggestions.length)}
            >
              <div className="h-[44px] w-[44px] rounded-lg bg-[#DDF5E8] flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#087F5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#087F5B]">
                View all results for &ldquo;{query}&rdquo;
              </p>
            </li>
          </ul>
        </div>
      )}

      {/* Empty state */}
      {open && query.trim().length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-[#E3EBE6] bg-white shadow-xl shadow-black/8 p-5 text-center">
          <p className="text-[14px] text-[#596B62]">
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="text-[12px] text-[#596B62] mt-1">
            Try a different spelling or fewer keywords.
          </p>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#596B62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
