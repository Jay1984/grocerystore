"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { SearchAutocomplete } from "./search-autocomplete";

export function DashboardSearch() {
  const router = useRouter();

  const onSearch = useCallback(
    (q: string) => {
      router.push(`/compare?q=${encodeURIComponent(q)}`);
    },
    [router]
  );

  const onCategorySelect = useCallback(
    (catId: string) => {
      router.push(`/compare?category=${encodeURIComponent(catId)}`);
    },
    [router]
  );

  const onBrandSelect = useCallback(
    (brand: string) => {
      router.push(`/compare?q=${encodeURIComponent(brand)}`);
    },
    [router]
  );

  const onProductSelect = useCallback(
    (productId: string) => {
      router.push(`/compare?q=${encodeURIComponent(productId)}`);
    },
    [router]
  );

  return (
    <SearchAutocomplete
      onSearch={onSearch}
      onCategorySelect={onCategorySelect}
      onBrandSelect={onBrandSelect}
      onProductSelect={onProductSelect}
      placeholder="Search 17,000+ products across stores…"
      className="w-[650px] max-w-full"
    />
  );
}
