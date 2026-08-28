"use client";

import type { Dispatch, KeyboardEvent } from "react";

import { canAdd } from "@/shared/domain/setupRules";
import type { CapKey } from "@/shared/domain/setupRules";
import type { BuilderAction } from "@/shared/state/BuilderStore";
import type { Product } from "@/shared/types/product";
import type { SetupState } from "@/shared/types/setup";

interface CanvasSlotProps {
  label: string;
  emptyHint: string;
  icon: string;
  capKey: CapKey;
  /** Catalog products of this capKey (the add target is the first). */
  products: readonly Product[];
  state: SetupState;
  dispatch: Dispatch<BuilderAction>;
  variant?: "canvas" | "zone";
  className?: string;
}

/**
 * A builder slot (monitor/lamp/plant) or secondary zone (coffee/bean bag).
 * Empty → dashed state with an add affordance; filled → the selected product's
 * image + a quantity badge. Keyboard contract (decision #24):
 * Enter/Space or ArrowUp/Right → +1 · ArrowDown/Left → -1 (respecting caps).
 */
export function CanvasSlot({
  label,
  emptyHint,
  icon,
  capKey,
  products,
  state,
  dispatch,
  variant = "canvas",
  className = "",
}: CanvasSlotProps) {
  const target = products[0];
  const selected = products.find((p) => state.quantities[p.id] !== undefined);
  const quantity = selected ? (state.quantities[selected.id] ?? 0) : 0;

  const canAddMore = canAdd(state, selected ?? target ?? { id: "", category: "accessory" });
  const canStepDown = quantity > 1;
  const canRemove = quantity === 1;

  const onAdd = () => {
    if (target !== undefined) {
      dispatch({ type: "addAccessory", product: target });
    }
  };
  const onStep = (delta: number) => {
    if (delta > 0) {
      // Stepper UX: ArrowUp from empty adds the first product of this cap key.
      if (selected === undefined) {
        onAdd();
      } else if (canAddMore) {
        dispatch({ type: "setQuantity", product: selected, quantity: quantity + 1 });
      }
    } else if (selected !== undefined) {
      if (canStepDown) {
        dispatch({ type: "setQuantity", product: selected, quantity: quantity - 1 });
      } else if (canRemove) {
        dispatch({ type: "removeAccessory", productId: selected.id });
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAdd();
    } else if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      onStep(1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      onStep(-1);
    }
  };

  const isZone = variant === "zone";
  const labelForSlot = capKey === "extra" ? "Surfboard" : label;

  if (selected === undefined) {
    return (
      <button
        type="button"
        aria-label={emptyHint}
        className={`slot-empty hover:bg-surface-container-low focus-visible:outline-primary group flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isZone ? "h-24 w-full" : "h-32 w-48"} ${className}`}
        onClick={onAdd}
        onKeyDown={onKeyDown}
      >
        <span
          className="material-symbols-outlined text-outline group-hover:text-primary"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-label-sm font-label-sm text-outline group-hover:text-primary">
          {emptyHint}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`${labelForSlot}: ${quantity}`}
      aria-pressed="true"
      className={`border-primary bg-surface-container-low focus-visible:outline-primary group flex items-center justify-center overflow-hidden rounded-xl border-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${isZone ? "relative" : ""} ${isZone ? "h-24 w-full" : "h-32 w-48"} ${className}`}
      onClick={onAdd}
      onKeyDown={onKeyDown}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- slot thumbnails (mockup parity) */}
      <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
      <span className="bg-primary text-label-sm text-on-primary absolute right-1 top-1 rounded-full px-2 py-0.5 font-bold">
        ×{quantity}
      </span>
      {!canAddMore ? (
        <span className="bg-on-surface/70 text-label-sm text-inverse-on-surface absolute inset-x-0 bottom-0 py-0.5 text-center font-bold">
          Max
        </span>
      ) : null}
    </button>
  );
}
