"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { monthlyTotal } from "../domain/pricing";
import { logger } from "../observability/logger";
import { BuilderStoreProvider, useBuilderReducer, useBuilderStore } from "../state/BuilderStore";
import { readStoredSetup, writeStoredSetup } from "../state/useLocalStorage";
import type { Product } from "../types/product";
import type { SetupState } from "../types/setup";

const SSR_SAFE_EMPTY: SetupState = {
  chairId: null,
  deskId: null,
  quantities: {},
  monitorSlots: [],
};

/** Line items derived from the full cart (chair + desk + quantities + slots). */
function lineItemsFor(
  state: SetupState,
  catalog: readonly Product[],
): { product: Product; quantity: number }[] {
  const items: { product: Product; quantity: number }[] = [];

  const chair = state.chairId ? catalog.find((p) => p.skuNo === state.chairId) : undefined;
  const desk = state.deskId ? catalog.find((p) => p.skuNo === state.deskId) : undefined;
  if (chair) items.push({ product: chair, quantity: 1 });
  if (desk) items.push({ product: desk, quantity: 1 });

  for (const [id, quantity] of Object.entries(state.quantities)) {
    const product = catalog.find((p) => p.skuNo === id);
    if (product) items.push({ product, quantity });
  }

  // monitor slots → line items grouped by skuNo (duplicates allowed).
  const monitorCounts = new Map<string, number>();
  for (const sku of state.monitorSlots ?? []) {
    monitorCounts.set(sku, (monitorCounts.get(sku) ?? 0) + 1);
  }
  for (const [sku, quantity] of monitorCounts) {
    const product = catalog.find((p) => p.skuNo === sku);
    if (product) items.push({ product, quantity });
  }

  return items;
}

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

  // Write-through on every change (quota-guarded, E3). Gated on the catalog
  // being loaded: before that, the hydration read can't validate a seeded
  // cart yet — writing the empty state would clobber it.
  useEffect(() => {
    if (catalog.length === 0) {
      return;
    }
    writeStoredSetup(state);
  }, [state, catalog]);

  // cart.updated (Q2/Q5): emitted when the cart CONTENT changes (not delivery
  // typing, not the initial mount). Payload: item count + monthly total.
  const contentSignature = JSON.stringify([
    state.chairId,
    state.deskId,
    state.quantities,
    state.monitorSlots,
  ]);
  const lastContent = useRef<string | null>(null);
  useEffect(() => {
    if (lastContent.current === null) {
      lastContent.current = contentSignature; // initial mount — no event
      return;
    }
    if (lastContent.current === contentSignature) {
      return; // delivery-only change — not a cart-content mutation
    }
    lastContent.current = contentSignature;
    const items = lineItemsFor(state, catalog);
    const total = monthlyTotal(
      items.map((item) => ({ pricePerMonth: item.product.pricePerMonth, quantity: item.quantity })),
    );
    logger.debug("cart.updated", {
      items: items.reduce((sum, item) => sum + item.quantity, 0),
      total,
    });
  }, [contentSignature, state, catalog]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <BuilderStoreProvider value={value}>{children}</BuilderStoreProvider>;
}

/** Derived cart data for features: line items + monthly total (#7). */
export function useCartTotals(catalog: readonly Product[]) {
  const { state } = useBuilderStore();

  return useMemo(() => {
    const items = lineItemsFor(state, catalog);
    const total = monthlyTotal(
      items.map((item) => ({ pricePerMonth: item.product.pricePerMonth, quantity: item.quantity })),
    );
    return { lineItems: items, total };
  }, [state, catalog]);
}
