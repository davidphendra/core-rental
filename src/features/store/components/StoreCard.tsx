"use client";

import { QUANTITY_CAPS, capKeyForProduct } from "@/shared/domain/setupRules";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { Button } from "@/shared/ui/Button";
import { ProductCard } from "@/shared/ui/ProductCard";
import type { Product } from "@/shared/types/product";

interface StoreCardProps {
  product: Product;
  /** Wired by e06s02 to open the partner request modal. */
  onRequestPartner?: (product: Product) => void;
}

/**
 * Store product card (bali_essentials_store mockup). Chairs/desks select
 * (exclusivity), accessories/extras add with caps (N3), partner items open the
 * request flow (#20).
 */
export function StoreCard({ product, onRequestPartner }: StoreCardProps) {
  const { state, dispatch } = useBuilderStore();

  const isChair = product.category === "chair";
  const isDesk = product.category === "desk";
  const isPartner = product.category === "partner";

  const selected = isChair
    ? state.chairId === product.id
    : isDesk
      ? state.deskId === product.id
      : (state.quantities[product.id] ?? 0) > 0;

  const cap = capKeyForProduct(product);
  const max = cap === null ? null : QUANTITY_CAPS[cap];
  const atCap = max !== null && (state.quantities[product.id] ?? 0) >= max;

  const onAdd = () => {
    if (isChair) {
      dispatch({ type: "selectChair", product });
    } else if (isDesk) {
      dispatch({ type: "selectDesk", product });
    } else {
      dispatch({ type: "addAccessory", product });
    }
  };

  return (
    <ProductCard product={product} selected={selected}>
      {isPartner ? (
        <Button
          variant="tertiary"
          className="w-full"
          aria-label={`Request rental for ${product.name}`}
          onClick={() => onRequestPartner?.(product)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            two_wheeler
          </span>
          Request Rental
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          disabled={atCap}
          aria-label={`Add ${product.name} to setup`}
          onClick={onAdd}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            add_circle
          </span>
          {selected ? "Added" : "Add to Setup"}
        </Button>
      )}
    </ProductCard>
  );
}
