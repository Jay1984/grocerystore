"use client";

import { useCallback } from "react";
import { SearchAutocomplete } from "./search-autocomplete";
import { SEED_PRODUCTS, type SeedProduct } from "@/lib/seed-data";

interface Props {
  onAddProduct: (product: SeedProduct) => void;
}

export function BasketSearch({ onAddProduct }: Props) {
  const handleProductSelect = useCallback(
    (productId: string) => {
      const match = SEED_PRODUCTS.find((p) => p.id === productId);
      if (match) {
        onAddProduct(match);
      }
    },
    [onAddProduct]
  );

  const handleSearch = useCallback(
    (q: string) => {
      const match = SEED_PRODUCTS.find(
        (p) => p.name.toLowerCase().includes(q.toLowerCase())
      );
      if (match) {
        onAddProduct(match);
      }
    },
    [onAddProduct]
  );

  return (
    <SearchAutocomplete
      onProductSelect={handleProductSelect}
      onSearch={handleSearch}
      placeholder="Search to add products to basket…"
      className="w-[650px] max-w-full"
      restrictTypes={["product"]}
    />
  );
}
