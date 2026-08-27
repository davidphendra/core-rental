"use client";

import { capKeyForProduct } from "@/shared/domain/setupRules";
import type { Product } from "@/shared/types/product";
import type { SetupState } from "@/shared/types/setup";

interface ZoneTilesProps {
  catalog: readonly Product[];
  state: SetupState;
}

/**
 * Summary zone overview (decision C3): only the two real builder zones —
 * Coffee Station and Relax Zone — with cart-driven fill states. Garage and
 * Outdoor tiles are deliberately absent (#6, C3).
 */
export function ZoneTiles({ catalog, state }: ZoneTilesProps) {
  const hasInCapKey = (key: "coffee" | "beanbag") =>
    catalog.some((p) => capKeyForProduct(p) === key && (state.quantities[p.id] ?? 0) > 0);

  const coffee = hasInCapKey("coffee");
  const relax = hasInCapKey("beanbag");

  const tiles = [
    { label: "Coffee Station", icon: "coffee_maker", filled: coffee },
    { label: "Relax Zone", icon: "chair_alt", filled: relax },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map(({ label, icon, filled }) => (
        <div
          key={label}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center ${
            filled
              ? "border-outline-variant/30 bg-surface"
              : "border-outline-variant/30 bg-surface opacity-60"
          }`}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              filled
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {icon}
            </span>
          </span>
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            {label}
            {!filled ? " (Empty)" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
