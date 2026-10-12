"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/grocery-list", label: "My Monthly Grocery", icon: ShoppingBasketIcon },
  { href: "/favorites", label: "My Favorites", icon: HeartIcon },
  { href: "/compare", label: "Compare Prices", icon: ScaleIcon },
  { href: "/deals", label: "Discover Offers", icon: TagIcon },
  { href: "/trends", label: "Price History", icon: TrendingUpIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[224px] lg:shrink-0 border-r border-[var(--color-border-light)] bg-[var(--color-surface)] h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-5 pb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-teal-accent)] text-white text-sm font-bold">G</span>
          <div>
            <span className="text-[15px] font-bold text-[var(--color-text-primary)]">GroceryCompare</span>
            <span className="ml-1 text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">BH</span>
          </div>
        </Link>
      </div>

      {/* Nav section */}
      <div className="px-3 flex-1">
        <p className="px-2 mb-2 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Your Household
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
                  isActive
                    ? "bg-[var(--color-teal-light)] text-[var(--color-teal-accent)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Icon size={18} active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-teal-light)] hover:text-[var(--color-text-primary)] transition-colors">
          <HelpIcon size={18} />
          Help & feedback
        </button>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-teal-accent)] text-white text-[12px] font-semibold">
            JD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">My household</p>
            <p className="text-[11px] text-[var(--color-text-secondary)] truncate">Bahrain</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function LayoutDashboardIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function ShoppingBasketIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h2l3.6 7.59L6 14c-.3.5.2 1 .8 1H19" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /><path d="M7.5 10.5h13l-1.5 5H9" />
    </svg>
  );
}

function ScaleIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l3-8 3 8c-.9.5-2.1.8-3 .8s-2.1-.3-3-.8z" /><path d="M2 16l3-8 3 8c-.9.5-2.1.8-3 .8s-2.1-.3-3-.8z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

function TagIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l6.6-6.6a1 1 0 0 0 0-1.4L12 2Z" /><path d="M7 7h.01" />
    </svg>
  );
}

function TrendingUpIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function HeartIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function HelpIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
    </svg>
  );
}

function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
