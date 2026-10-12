"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatBHD } from "@/lib/price";
import {
  addItemToList,
  findItemInList,
  getCurrentMonthKey,
  getMonthLabel,
} from "@/lib/grocery-list";

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

function getMonthOptions(): { key: string; label: string }[] {
  const now = new Date();
  const options: { key: string; label: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ key, label: getMonthLabel(key) });
  }
  return options;
}

export function AddToGroceryButton({
  productId,
  productTitle,
  brand,
  size,
  price,
  originalPrice,
  retailerId,
  category,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [month, setMonth] = useState(getCurrentMonthKey);
  const [existing, setExisting] = useState<{ quantity: number } | null>(null);

  useEffect(() => {
    if (open) {
      const found = findItemInList(productId, month);
      setExisting(found ? { quantity: found.quantity } : null);
    }
  }, [open, month, productId]);

  function handleAdd() {
    const result = addItemToList(
      {
        productId,
        title: productTitle,
        brand,
        size,
        quantity: qty,
        price,
        originalPrice,
        retailerId,
        category,
      },
      month
    );

    setOpen(false);
    setQty(1);

    const monthLabel = getMonthLabel(month);
    toast.add({
      type: "success",
      title:
        result.action === "updated"
          ? `Updated quantity to ${result.item.quantity}`
          : `Added to ${monthLabel}`,
      description: productTitle,
      actionProps: {
        children: "View Grocery List",
        onClick: () => router.push(`/grocery-list?month=${month}`),
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="rounded-lg border border-[#333] px-4 py-2 text-[13px] font-semibold text-[#333] hover:bg-[#F5F5F5] transition-colors whitespace-nowrap" />
        }
      >
        + Add to monthly list
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Monthly Grocery</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Product info */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <p className="text-[14px] font-medium text-[#111827] leading-snug">{productTitle}</p>
            <div className="flex flex-wrap gap-x-3 mt-1 text-[12px] text-[#596B62]">
              {brand && <span>{brand}</span>}
              {size && <span>{size}</span>}
              {price > 0 && (
                <span className="font-semibold text-[#087F5B]">{formatBHD(price.toFixed(3))}</span>
              )}
            </div>
          </div>

          {/* Duplicate warning */}
          {existing && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              Already in this list (qty: {existing.quantity}). Adding will increase quantity by {qty}.
            </div>
          )}

          {/* Month selector */}
          <div>
            <label className="block text-[13px] font-medium text-[#475569] mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#087F5B] focus:ring-1 focus:ring-[#087F5B]"
            >
              {getMonthOptions().map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[13px] font-medium text-[#475569] mb-1">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-8 w-8 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-sm font-semibold"
              >
                −
              </button>
              <span className="w-8 text-center text-[15px] font-semibold text-[#111827] tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="h-8 w-8 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-sm font-semibold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto rounded-lg bg-[#087F5B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#065F46] transition-colors"
          >
            {existing ? "Update Quantity" : "Add to Monthly Grocery"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
