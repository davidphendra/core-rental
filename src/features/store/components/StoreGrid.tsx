"use client";

import { useState } from "react";

import type { Product } from "@/shared/types/product";

import { StoreCard } from "./StoreCard";

type Tab = "chair" | "desk" | "accessory";

const TABS: { key: Tab; label: string }[] = [
  { key: "chair", label: "Chairs" },
  { key: "desk", label: "Desks" },
  { key: "accessory", label: "Accessories" },
];

function matchesTab(product: Product, tab: Tab): boolean {
  return product.category === tab;
}

interface StoreGridProps {
  catalog: readonly Product[];
}

/**
 * Store grid + working category filter (decision #33). Display-only catalog
 * gallery — the Extras category (surfboard family + partner motorcycle) is not
 * listed in the store.
 */
export function StoreGrid({ catalog }: StoreGridProps) {
  const [tab, setTab] = useState<Tab>("chair");
  const filtered = catalog.filter((p) => matchesTab(p, tab));

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product categories"
        className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2"
      >
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`text-label-md font-label-md focus-visible:outline-primary whitespace-nowrap rounded-full px-4 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "border-outline-variant bg-surface-container text-on-surface-variant border"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <StoreCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
