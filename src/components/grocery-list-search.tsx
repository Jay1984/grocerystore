"use client";

import { useCallback } from "react";
import { SearchAutocomplete } from "./search-autocomplete";
import type { SearchSuggestion } from "@/lib/search-suggestions";
import { type GroceryItem, loadGroceryList, saveGroceryList } from "@/lib/grocery-list";

interface Props {
  onItemAdded: () => void;
}

export function GroceryListSearch({ onItemAdded }: Props) {
  const handleProductSelect = useCallback(
    (productId: string) => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(productId)}&limit=1`)
        .then((r) => r.json())
        .then((data) => {
          const suggestion: SearchSuggestion | undefined = data.suggestions?.[0];
          if (!suggestion || suggestion.type !== "product") return;

          const list = loadGroceryList();
          const existing = list.find((i) => i.productId === productId);
          if (existing) {
            existing.quantity += 1;
          } else {
            list.push({
              productId,
              title: suggestion.label,
              brand: suggestion.brandName || null,
              size: suggestion.subtitle || null,
              quantity: 1,
              addedAt: new Date().toISOString(),
              price: suggestion.price ?? 0,
              originalPrice: null,
              retailerId: "",
              category: suggestion.categoryId || "",
            });
          }
          saveGroceryList(list);
          onItemAdded();
        });
    },
    [onItemAdded]
  );

  return (
    <SearchAutocomplete
      onProductSelect={handleProductSelect}
      placeholder="Search products to add to your list…"
      className="w-[650px] max-w-full"
      restrictTypes={["product"]}
    />
  );
}
