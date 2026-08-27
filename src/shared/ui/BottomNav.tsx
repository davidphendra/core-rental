"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/builder", label: "Build", icon: "architecture" },
  { href: "/store", label: "Store", icon: "storefront" },
  { href: "/summary", label: "Summary", icon: "receipt_long" },
  { href: "/summary", label: "Rent", icon: "shopping_cart" },
] as const;

/** Mobile bottom nav (mockup, all pages) — active state via usePathname. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="bg-surface fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl px-4 py-2 shadow-lg lg:hidden"
    >
      {ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center rounded-2xl px-4 py-1 transition-colors ${
              active
                ? "bg-secondary-container text-on-secondary-container scale-90"
                : "text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {icon}
            </span>
            <span className="text-label-sm font-label-sm mt-1 font-bold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
