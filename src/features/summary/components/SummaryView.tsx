"use client";

import { useBuilderStore } from "@/shared/state/BuilderStore";
import { useCartTotals } from "@/shared/state/CartProvider";
import { Button } from "@/shared/ui/Button";
import { PriceTag } from "@/shared/ui/PriceTag";
import type { Product } from "@/shared/types/product";

import { DeliveryInput, isDeliveryValid } from "./DeliveryInput";
import { EmptyState } from "./EmptyState";

interface SummaryViewProps {
  catalog: readonly Product[];
  /** Wired by e07s02 to open the mock confirmation. */
  onRent?: () => void;
}

/**
 * Summary receipt (review_rent mockup with rulings): line items + Qty +
 * Monthly Total only (C1 — no delivery fee/grand total), Delivery Location
 * input (C4/G3), and the N1 empty state (#23). Borderless full-width receipt
 * (C8) — the Order Summary is the whole, left-aligned content.
 */
export function SummaryView({ catalog, onRent }: SummaryViewProps) {
  const { state, dispatch } = useBuilderStore();
  const { lineItems, total } = useCartTotals(catalog);

  const isEmpty =
    state.chairId === null && state.deskId === null && Object.keys(state.quantities).length === 0;

  if (isEmpty) {
    return <EmptyState />;
  }

  const delivery = state.deliveryLocation ?? "";
  const deliveryValid = isDeliveryValid(delivery);

  return (
    <div className="w-full p-6">
      <h2 className="border-surface-variant text-headline-md font-headline-md text-primary border-b pb-4">
        Order Summary
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {lineItems.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-label-md font-label-md text-on-surface">{product.name}</span>
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                Qty: {quantity}
              </span>
            </div>
            <PriceTag
              amount={product.pricePerMonth * quantity}
              className="text-body-md text-on-surface font-semibold"
            />
          </li>
        ))}
      </ul>

      <div className="border-surface-variant mt-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-headline-md font-headline-md text-on-surface">Monthly Total</span>
          <PriceTag
            amount={total}
            suffix="/mo"
            className="text-headline-md font-headline-md text-primary"
          />
        </div>
      </div>

      <div className="border-surface-variant mt-6 border-t pt-4">
        <DeliveryInput
          value={delivery}
          onChange={(value) => dispatch({ type: "setDeliveryLocation", value })}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="tertiary" disabled={!deliveryValid} onClick={() => onRent?.()}>
          <span className="material-symbols-outlined" aria-hidden="true">
            shopping_cart_checkout
          </span>
          Rent This Setup
        </Button>
      </div>
    </div>
  );
}
