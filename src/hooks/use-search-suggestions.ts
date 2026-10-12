"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SearchSuggestion } from "@/lib/search-suggestions";

interface UseSearchSuggestionsOpts {
  category?: string;
  retailer?: string;
  debounceMs?: number;
  limit?: number;
}

export function useSearchSuggestions(opts: UseSearchSuggestionsOpts = {}) {
  const { category, retailer, debounceMs = 200, limit = 8 } = opts;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const fetchSuggestions = useCallback(
    (q: string) => {
      const id = ++requestIdRef.current;
      if (q.trim().length < 2) {
        setSuggestions([]);
        setOpen(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams({ q, limit: String(limit) });
      if (category) params.set("category", category);
      if (retailer) params.set("retailer", retailer);

      fetch(`/api/search/suggestions?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          if (id !== requestIdRef.current) return;
          setSuggestions(data.suggestions || []);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => {})
        .finally(() => {
          if (id === requestIdRef.current) setLoading(false);
        });
    },
    [category, retailer, limit]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(query), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, fetchSuggestions, debounceMs]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return;

      const total = suggestions.length + 1; // +1 for "View all"

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % total);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? total - 1 : i - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [open, suggestions.length, close]
  );

  return {
    query,
    setQuery,
    suggestions,
    loading,
    open,
    setOpen,
    activeIndex,
    setActiveIndex,
    close,
    handleKeyDown,
  };
}
