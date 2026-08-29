"use client";

import { useEffect, useRef, useState } from "react";

import { useBuilderStore } from "@/shared/state/BuilderStore";
import type { Product } from "@/shared/types/product";

interface MonitorSlotRowProps {
  /** Catalog monitors (capKey "monitor"). */
  monitors: readonly Product[];
}

const SLOT_INDICES = [0, 1, 2] as const;

/**
 * e09s02: the three discrete monitor slots above the desk. Each position shows
 * a filled card (image + ×) or an empty "Add Monitor" button. The state model
 * is insertion-ordered (`monitorSlots`), so position i shows the i-th placed
 * monitor. When a full row is replaced via the panel Select, the swapped card
 * briefly highlights (Q2 ruling).
 */
export function MonitorSlotRow({ monitors }: MonitorSlotRowProps) {
  const { state, dispatch } = useBuilderStore();
  const [replacedIndex, setReplacedIndex] = useState<number | null>(null);
  const prevRef = useRef<string[]>(state.monitorSlots);

  // Detect a replace (row was full and the last element changed) to animate
  // the swapped card. Purely visual — state recency lives in the reducer.
  useEffect(() => {
    const prev = prevRef.current;
    const curr = state.monitorSlots;
    prevRef.current = curr;
    if (prev.length === 3 && curr.length === 3 && prev[2] !== curr[2]) {
      setReplacedIndex(2);
      const timer = setTimeout(() => setReplacedIndex(null), 900);
      return () => clearTimeout(timer);
    }
  }, [state.monitorSlots]);

  const firstMonitor = monitors[0];

  return (
    <div className="absolute bottom-36 left-1/2 z-10 flex -translate-x-1/2 gap-3">
      {SLOT_INDICES.map((i) => {
        const sku = state.monitorSlots[i];
        const product = sku ? monitors.find((m) => m.skuNo === sku) : undefined;
        const isReplaced = replacedIndex === i;

        if (product === undefined) {
          return (
            <button
              key={i}
              type="button"
              aria-label="Add Monitor"
              onClick={() => {
                if (firstMonitor !== undefined) {
                  dispatch({ type: "selectMonitor", product: firstMonitor });
                }
              }}
              className="slot-empty hover:bg-surface-container-low focus-visible:outline-primary group flex h-28 w-40 flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                className="material-symbols-outlined text-outline group-hover:text-primary"
                aria-hidden="true"
              >
                monitor
              </span>
              <span className="text-label-sm font-label-sm text-outline group-hover:text-primary">
                Add Monitor
              </span>
            </button>
          );
        }

        return (
          <div
            key={i}
            className={`border-surface-container-high relative h-28 w-40 overflow-hidden rounded-xl border-2 transition-all ${
              isReplaced ? "border-primary ring-primary animate-pulse ring-2" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- slot thumbnail (mockup parity) */}
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove Monitor"
              onClick={() => dispatch({ type: "removeMonitorSlot", index: i })}
              className="bg-on-surface/70 text-inverse-on-surface focus-visible:outline-primary hover:bg-on-surface absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
