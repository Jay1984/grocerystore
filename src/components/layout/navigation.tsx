"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/compare", label: "Compare Prices" },
  { href: "/favorites", label: "My Favorites" },
  { href: "/deals", label: "Best Deals" },
  { href: "/basket", label: "My Basket" },
  { href: "/trends", label: "Price Trends" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🛒</span>
            <span className="text-[#087F5B]">GroceryCompare</span>
            <span className="rounded bg-[#D1FAE5] px-1.5 py-0.5 text-xs font-medium text-[#087F5B]">
              BH
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#ECFDF5] text-[#087F5B]"
                      : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="md:hidden">
            <MobileMenu pathname={pathname} />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer rounded-md p-2 hover:bg-[#F8FAFC] list-none">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </summary>
      <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white py-1 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm ${
                isActive
                  ? "bg-[#ECFDF5] text-[#087F5B]"
                  : "text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
