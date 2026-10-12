"use client";

import { useFavorites } from "./favorites-provider";
import { toast } from "@/components/ui/toast";

interface Props {
  productId: string;
  productTitle: string;
  brand: string | null;
  size: string | null;
  category: string;
  className?: string;
}

export function FavoriteButton({
  productId,
  productTitle,
  brand,
  size,
  category,
  className = "",
}: Props) {
  const { toggle, isFavorite } = useFavorites();
  const favorited = isFavorite(productId);

  function handleClick() {
    const action = toggle({ productId, title: productTitle, brand, size, category });
    toast.add({
      type: "success",
      title: action === "added" ? "Added to Favorites" : "Removed from Favorites",
      description: productTitle,
    });
  }

  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center justify-center rounded-lg p-1.5 transition-colors ${
        favorited
          ? "text-red-500 hover:text-red-600"
          : "text-[#94A3B8] hover:text-red-400"
      } ${className}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
