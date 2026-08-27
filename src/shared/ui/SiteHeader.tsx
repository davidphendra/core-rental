"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/builder", label: "Workspace Builder" },
  { href: "/store", label: "Accessory Store" },
] as const;

/** Site header (mockup, all pages): brand + nav + shopping bag. No avatar (C5). */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-surface sticky top-0 z-40 w-full">
      <div className="max-w-container-max px-margin-mobile md:px-margin-desktop mx-auto flex h-20 w-full items-center justify-between">
        <Link
          href="/"
          className="text-headline-md font-headline-md text-primary font-bold tracking-tight"
        >
          Core Rental
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`text-body-md font-body-md transition-colors ${
                pathname === href
                  ? "border-primary text-primary border-b-2 pb-1"
                  : "text-on-surface-variant hover:text-primary-container"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/summary"
          aria-label="View your setup"
          className="text-primary hover:bg-surface-variant rounded-full p-2 transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            shopping_bag
          </span>
        </Link>
      </div>
    </header>
  );
}
