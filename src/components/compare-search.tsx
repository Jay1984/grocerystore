"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { SearchAutocomplete } from "./search-autocomplete";

interface Props {
  initialQuery: string;
  category: string;
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

export function CompareSearch({ initialQuery, category, cats, retailer, sort, pageSize }: Props) {
  const router = useRouter();

  const onSearch = useCallback(
    (q: string) => {
      router.push(buildUrl({ q: q || undefined, cats, retailer, sort, size: String(pageSize) }));
    },
    [router, cats, retailer, sort, pageSize]
  );

  const onCategorySelect = useCallback(
    (catId: string) => {
      router.push(buildUrl({ q: initialQuery || undefined, cats: catId, retailer, sort, size: String(pageSize) }));
    },
    [router, initialQuery, retailer, sort, pageSize]
  );

  const onBrandSelect = useCallback(
    (brand: string) => {
      router.push(buildUrl({ q: brand, cats, retailer, sort, size: String(pageSize) }));
    },
    [router, cats, retailer, sort, pageSize]
  );

  const onProductSelect = useCallback(
    (productId: string) => {
      router.push(buildUrl({ q: productId.includes("-") ? undefined : productId, cats, retailer, sort, size: String(pageSize) }));
    },
    [router, cats, retailer, sort, pageSize]
  );

  return (
    <SearchAutocomplete
      initialQuery={initialQuery}
      category={category !== "all" ? category : undefined}
      retailer={retailer !== "all" ? retailer : undefined}
      onSearch={onSearch}
      onCategorySelect={onCategorySelect}
      onBrandSelect={onBrandSelect}
      onProductSelect={onProductSelect}
      className="w-[650px] max-w-full"
    />
  );
}
