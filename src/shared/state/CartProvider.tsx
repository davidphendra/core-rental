"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";

import { monthlyTotal } from "../domain/pricing";
import { BuilderStoreProvider, useBuilderReducer, useBuilderStore } from "../state/BuilderStore";
import { readStoredSetup, writeStoredSetup } from "../state/useLocalStorage";
import type { Product } from "../types/product";
import type { SetupState } from "../types/setup";

const SSR_SAFE_EMPTY: SetupState = { chairId: null, deskId: null, quantities: {} };

/**
 * The cross-feature cart wiring (decisions #11, D1, G1, E3):
 * - SSR-safe empty initial state (no hydration mismatch)
 * - post-mount hydration: validate-and-fallback (G1) — stored setup if valid,
 *   otherwise defaults
 * - write-through persistence with quota guard (E3)
 */
export function CartProvider({
  catalog,
  children,
}: {
  catalog: readonly Product[];
  children: ReactNode;
}) {
  const [state, dispatch] = useBuilderReducer(SSR_SAFE_EMPTY);

  // Hydrate once the catalog is available (client-only read, after mount).
  useEffect(() => {
    const stored = readStoredSetup(catalog);
    if (stored !== null) {
      dispatch({ type: "hydrate", state: stored });
    }
  }, [catalog, dispatch]);

  // Write-through on every change (quota-guarded, E3).
  useEffect(() => {
    writeStoredSetup(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <BuilderStoreProvider value={value}>{children}</BuilderStoreProvider>;
}

/** Derived cart data for features: line items + monthly total (#7). */
export function useCartTotals(catalog: readonly Product[]) {
  const { state } = useBuilderStore();

  return useMemo(() => {
    const items: { pricePerMonth: number; quantity: number }[] = [];

    const chair = state.chairId ? catalog.find((p) => p.id === state.chairId) : undefined;
    const desk = state.deskId ? catalog.find((p) => p.id === state.deskId) : undefined;

    if (chair) items.push({ pricePerMonth: chair.pricePerMonth, quantity: 1 });
    if (desk) items.push({ pricePerMonth: desk.pricePerMonth, quantity: 1 });

    for (const [id, quantity] of Object.entries(state.quantities)) {
      const product = catalog.find((p) => p.id === id);
      if (product) items.push({ pricePerMonth: product.pricePerMonth, quantity });
    }

    return { lineItems: items, total: monthlyTotal(items) };
  }, [state, catalog]);
}
