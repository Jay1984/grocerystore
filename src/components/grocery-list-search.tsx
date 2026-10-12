"use client";

import { useCallback } from "react";
import { SearchAutocomplete } from "./search-autocomplete";
import type { SearchSuggestion } from "@/lib/search-suggestions";
import { addItemToList } from "@/lib/grocery-list";

interface Props {
  monthKey: string;
  onItemAdded: () => void;
}

export function GroceryListSearch({ monthKey, onItemAdded }: Props) {
  const handleProductSelect = useCallback(
    (productId: string) => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(productId)}&limit=1`)
        .then((r) => r.json())
        .then((data) => {
          const suggestion: SearchSuggestion | undefined = data.suggestions?.[0];
          if (!suggestion || suggestion.type !== "product") return;

          addItemToList(
            {
              productId,
              title: suggestion.label,
              brand: suggestion.brandName || null,
              size: suggestion.subtitle || null,
              quantity: 1,
              price: suggestion.price ?? 0,
              originalPrice: null,
              retailerId: "",
              category: suggestion.categoryId || "",
            },
            monthKey
          );
          onItemAdded();
        });
    },
    [monthKey, onItemAdded]
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
