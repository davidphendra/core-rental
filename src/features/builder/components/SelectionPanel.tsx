"use client";

import { useState } from "react";

import { capKeyForProduct } from "@/shared/domain/setupRules";
import type { CapKey } from "@/shared/domain/setupRules";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { Button } from "@/shared/ui/Button";
import { ProductCard } from "@/shared/ui/ProductCard";
import type { Product } from "@/shared/types/product";

import { QuantityStepper } from "./QuantityStepper";

type Tab = "chair" | "desk" | "accessory";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "chair", label: "Chairs", icon: "chair" },
  { key: "desk", label: "Desks", icon: "desk" },
  { key: "accessory", label: "Accessories", icon: "keyboard" },
];

/** Accessory subtype group headers keep the 42-item tab navigable. "misc"
 * groups coffee + beanbag (canvas zones also surface them). */
type PanelGroup = CapKey | "misc";
const SUBTYPE_ORDER: PanelGroup[] = ["monitor", "lamp", "plant", "misc"];

/**
 * Builder selection panel (interactive_builder mockup): tabs filter the unified
 * catalog; chairs/desks are single-select (exclusivity, #10); accessories get
 * quantity steppers (caps, #22). Coffee/beanbag are managed on the canvas
 * zones (Coffee Station / Relax Zone) — not in the panel.
 */
export function SelectionPanel({ catalog }: { catalog: readonly Product[] }) {
  const { state, dispatch } = useBuilderStore();
  const [tab, setTab] = useState<Tab>("chair");
  // Per-tab keyword (Q1=2 ruling): each tab keeps its own search state.
  const [query, setQuery] = useState<Record<Tab, string>>({
    chair: "",
    desk: "",
    accessory: "",
  });

  /** Search matcher (Q3 ruling): case-insensitive substring on name OR description. */
  const matches = (product: Product) => {
    const q = query[tab].trim().toLowerCase();
    if (q.length === 0) {
      return true;
    }
    return product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q);
  };

  const filtered = catalog.filter((p) => {
    if (tab === "accessory") return p.category === "accessory";
    return p.category === tab;
  });
  const filteredByQuery = filtered.filter(matches);

  const grouped =
    tab === "accessory"
      ? SUBTYPE_ORDER.map((key) => ({
          key,
          items: filteredByQuery.filter((p) =>
            key === "misc"
              ? capKeyForProduct(p) === "coffee" || capKeyForProduct(p) === "beanbag"
              : capKeyForProduct(p) === key,
          ),
        }))
      : [];

  const isSelection = tab === "chair" || tab === "desk";
  const searchLabel =
    tab === "chair" ? "Search chairs" : tab === "desk" ? "Search desks" : "Search accessories";

  const clearSearch = () => setQuery((q) => ({ ...q, [tab]: "" }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="text-headline-md font-headline-md text-primary font-extrabold">
          Selection Panel
        </h2>
        <p className="text-label-md font-label-md text-on-surface-variant mt-1">Build your setup</p>
      </div>

      <div
        role="tablist"
        aria-label="Product categories"
        className="mb-4 flex justify-between gap-1"
      >
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <div key={key} className="group relative">
              <button
                type="button"
                role="tab"
                aria-label={label}
                aria-selected={active}
                onClick={() => setTab(key)}
                className={`focus-visible:outline-primary flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {icon}
                </span>
              </button>
              {/* Category name as a hover tooltip (icon-only tabs) */}
              <span
                aria-hidden="true"
                className="text-label-sm font-label-sm bg-on-surface text-inverse-on-surface pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-tab keyword search (Q1=2 ruling) — filters name/description. */}
      <div className="relative mb-3">
        <input
          type="search"
          aria-label={searchLabel}
          value={query[tab]}
          onChange={(e) => setQuery((q) => ({ ...q, [tab]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Escape") clearSearch();
          }}
          placeholder="Search…"
          className="focus-visible:outline-primary text-body-md bg-surface-container-lowest w-full rounded-xl px-3 py-2 pr-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        {query[tab].length > 0 ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clearSearch}
            className="bg-on-surface/70 text-inverse-on-surface hover:bg-on-surface focus-visible:outline-primary absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
              close
            </span>
          </button>
        ) : null}
      </div>

      <div className="border-outline-variant mt-4 flex-1 overflow-y-auto border-t pr-2 pt-4">
        {tab === "accessory" ? (
          grouped.map(({ key, items }) => (
            <div key={key} className="mb-4">
              <h3 className="text-label-sm font-label-sm text-outline mb-2 font-bold uppercase tracking-wider">
                {key}
              </h3>
              {items.length === 0 ? (
                <p className="text-label-sm font-label-sm text-on-surface-variant">
                  No {key} match.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((product) => (
                    <ProductCard key={product.skuNo} product={product} variant="compact">
                      {capKeyForProduct(product) === "monitor" ? (
                        // e09s02: monitors are slot-selected (fill/replace), not steppered
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={() => dispatch({ type: "selectMonitor", product })}
                        >
                          Select
                        </Button>
                      ) : (
                        <QuantityStepper product={product} />
                      )}
                    </ProductCard>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : filteredByQuery.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            {query[tab].trim().length > 0 ? "No products match." : "Nothing here yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredByQuery.map((product) => {
              const selected =
                tab === "chair" ? state.chairId === product.skuNo : state.deskId === product.skuNo;
              return (
                <ProductCard
                  key={product.skuNo}
                  product={product}
                  selected={selected}
                  variant="compact"
                >
                  {isSelection ? (
                    <Button
                      size="sm"
                      className="w-full"
                      variant={selected ? "primary" : "secondary"}
                      aria-pressed={selected}
                      onClick={() =>
                        dispatch(
                          selected
                            ? tab === "chair"
                              ? { type: "deselectChair" }
                              : { type: "deselectDesk" }
                            : tab === "chair"
                              ? { type: "selectChair", product }
                              : { type: "selectDesk", product },
                        )
                      }
                    >
                      {selected ? "Deselect" : "Select"}
                    </Button>
                  ) : (
                    <QuantityStepper product={product} />
                  )}
                </ProductCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
