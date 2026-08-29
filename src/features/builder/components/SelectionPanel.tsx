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

/** Accessory subtype group headers keep the 32-item tab navigable. */
const SUBTYPE_ORDER: CapKey[] = ["monitor", "lamp", "plant"];

/**
 * Builder selection panel (interactive_builder mockup): tabs filter the unified
 * catalog; chairs/desks are single-select (exclusivity, #10); accessories get
 * quantity steppers (caps, #22). Coffee/beanbag are managed on the canvas
 * zones (Coffee Station / Relax Zone) — not in the panel.
 */
export function SelectionPanel({ catalog }: { catalog: readonly Product[] }) {
  const { state, dispatch } = useBuilderStore();
  const [tab, setTab] = useState<Tab>("chair");

  const filtered = catalog.filter((p) => {
    if (tab === "accessory") return p.category === "accessory";
    return p.category === tab;
  });

  const grouped =
    tab === "accessory"
      ? SUBTYPE_ORDER.map((key) => ({
          key,
          items: filtered.filter((p) => capKeyForProduct(p) === key),
        })).filter((g) => g.items.length > 0)
      : [];

  const isSelection = tab === "chair" || tab === "desk";

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

      <div className="border-outline-variant mt-4 flex-1 overflow-y-auto border-t pr-2 pt-4">
        {tab === "accessory" ? (
          grouped.map(({ key, items }) => (
            <div key={key} className="mb-4">
              <h3 className="text-label-sm font-label-sm text-outline mb-2 font-bold uppercase tracking-wider">
                {key}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map((product) => (
                  <ProductCard key={product.skuNo} product={product} variant="compact">
                    <QuantityStepper product={product} />
                  </ProductCard>
                ))}
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => {
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
