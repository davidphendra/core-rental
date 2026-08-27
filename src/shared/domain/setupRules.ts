import type { Product } from "../types/product";
import type { SetupState } from "../types/setup";
/**
 * Per-category quantity caps (decision #22) — config table, easy to change.
 * Keys derive from product ids: `accessory-<key>-<slug>` or `extra-<slug>`.
 */
export const QUANTITY_CAPS = {
  monitor: 3,
  plant: 4,
  lamp: 2,
  coffee: 1,
  beanbag: 2,
  extra: 1,
} as const;

export type CapKey = keyof typeof QUANTITY_CAPS;

function isCapKey(value: string): value is CapKey {
  return Object.prototype.hasOwnProperty.call(QUANTITY_CAPS, value);
}

/**
 * The cap key for a product, or null when the product is single-select
 * (chair/desk — exclusivity, #10) or excluded (partner, #20).
 */
export function capKeyForProduct(product: Pick<Product, "id" | "category">): CapKey | null {
  if (product.category === "extra") {
    return "extra";
  }
  if (product.category !== "accessory") {
    return null; // chair/desk single-select; partner excluded
  }
  const key = product.id.split("-")[1] ?? "";
  return isCapKey(key) ? key : null;
}

/** Whether a product may ever enter the cart (partner excluded, #20). */
export function isCartEligible(product: Pick<Product, "category">): boolean {
  return product.category !== "partner";
}

/**
 * D1 defaults, applied when the cart has no chair AND no desk (fresh cart).
 * Returns the state to hydrate or null when defaults are not needed/possible.
 */
export function defaultsIfEmpty(
  state: Pick<SetupState, "chairId" | "deskId">,
  catalog: readonly Product[],
): Pick<SetupState, "chairId" | "deskId"> | null {
  if (state.chairId !== null || state.deskId !== null) {
    return null;
  }
  const chair = catalog.find((p) => p.category === "chair");
  const desk = catalog.find((p) => p.category === "desk");
  if (chair === undefined || desk === undefined) {
    return null;
  }
  return { chairId: chair.id, deskId: desk.id };
}

/**
 * Whether adding one more of this product is allowed for the given setup
 * (G2 reducer rule + N3 cap enforcement). Chair/desk adds are handled by
 * exclusivity semantics (select replaces) and are not quantity-checked here.
 */
export function canAdd(
  setup: Pick<SetupState, "quantities">,
  product: Pick<Product, "id" | "category">,
): boolean {
  if (!isCartEligible(product)) {
    return false;
  }
  const cap = capKeyForProduct(product);
  if (cap === null) {
    return true;
  }
  return (setup.quantities[product.id] ?? 0) < QUANTITY_CAPS[cap];
}

/**
 * D1 defaults: the first chair and first desk in the catalog, used when the
 * cart is empty or hydration fails (G1).
 */
export function defaultSelection(
  catalog: readonly Product[],
): Pick<SetupState, "chairId" | "deskId"> {
  const chair = catalog.find((p) => p.category === "chair");
  const desk = catalog.find((p) => p.category === "desk");
  return {
    chairId: chair?.id ?? null,
    deskId: desk?.id ?? null,
  };
}
