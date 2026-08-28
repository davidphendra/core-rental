import { ProductCard } from "@/shared/ui/ProductCard";
import type { Product } from "@/shared/types/product";

interface StoreCardProps {
  product: Product;
}

/**
 * Store product card (bali_essentials_store mockup). The store is a pure
 * catalog gallery: cards are display-only and adding happens in the Builder's
 * Selection Panel. Partner items carry an informational "Partner Service" pill
 * (mockup line 259) instead of any action (N6 — never addable, never in cart).
 */
export function StoreCard({ product }: StoreCardProps) {
  const isPartner = product.category === "partner";

  return (
    <ProductCard
      product={product}
      imageBadge={
        isPartner ? (
          <span className="bg-surface/90 border-surface-variant text-on-surface text-label-md font-label-md flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm backdrop-blur-sm">
            <span className="material-symbols-outlined text-tertiary-container" aria-hidden="true">
              verified
            </span>
            <span className="font-bold">Partner Service</span>
          </span>
        ) : undefined
      }
    />
  );
}
