"use client";

import { useState } from "react";
import { type GroceryItem, loadGroceryList, saveGroceryList } from "@/lib/grocery-list";

interface Props {
  productId: string;
  productTitle: string;
  brand: string | null;
  size: string | null;
  price: number;
  originalPrice: number | null;
  retailerId: string;
  category: string;
}

export function AddToGroceryButton({
  productId, productTitle, brand, size,
  price, originalPrice, retailerId, category,
}: Props) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    const list = loadGroceryList();
    const existing = list.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      list.push({
        productId,
        title: productTitle,
        brand,
        size,
        quantity: qty,
        addedAt: new Date().toISOString(),
        price,
        originalPrice,
        retailerId,
        category,
      });
    }
    saveGroceryList(list);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setOpen(false);
      setQty(1);
    }, 1500);
  }

  if (added) {
    return (
      <span className="rounded-lg bg-[#D1FAE5] px-3 py-1.5 text-[13px] font-medium text-[#065F46]">
        Added!
      </span>
    );
  }

  if (open) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="h-7 w-7 rounded border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-sm font-semibold"
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-semibold text-[#111827]">{qty}</span>
        <button
          onClick={() => setQty(qty + 1)}
          className="h-7 w-7 rounded border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-sm font-semibold"
        >
          +
        </button>
        <button
          onClick={handleAdd}
          className="rounded-lg bg-[#087F5B] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#065F46] transition-colors"
        >
          Add
        </button>
        <button
          onClick={() => { setOpen(false); setQty(1); }}
          className="text-[13px] text-[#64748B] hover:text-[#111827]"
        >
          &times;
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[13px] font-medium text-[#475569] hover:bg-[#ECFDF5] hover:text-[#087F5B] hover:border-[#087F5B]/30 transition-colors"
    >
      + Monthly Grocery
    </button>
  );
}
