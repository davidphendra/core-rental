"use client";

import { QUANTITY_CAPS, capKeyForProduct } from "@/shared/domain/setupRules";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { Button } from "@/shared/ui/Button";
import type { Product } from "@/shared/types/product";

interface QuantityStepperProps {
  product: Product;
}

/**
 * Accessory quantity stepper (decisions #10, #22; N3). UI-level cap
 * enforcement; the reducer rejects over-cap regardless (G2).
 */
export function QuantityStepper({ product }: QuantityStepperProps) {
  const { state, dispatch } = useBuilderStore();
  const quantity = state.quantities[product.id] ?? 0;

  const cap = capKeyForProduct(product);
  const max = cap === null ? null : QUANTITY_CAPS[cap];
  const atCap = max !== null && quantity >= max;

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        size="sm"
        aria-label={`Remove ${product.name}`}
        disabled={quantity === 0}
        onClick={() => dispatch({ type: "removeAccessory", productId: product.id })}
      >
        <span aria-hidden="true">−</span>
      </Button>
      <span aria-live="polite" className="text-label-md text-on-surface font-bold">
        {quantity}
      </span>
      <Button
        variant="primary"
        size="sm"
        aria-label={`Add ${product.name}`}
        disabled={atCap}
        onClick={() => dispatch({ type: "addAccessory", product })}
      >
        <span aria-hidden="true">+</span>
      </Button>
    </div>
  );
}
