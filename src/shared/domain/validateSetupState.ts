import type { Product } from "../types/product";
import type { SetupState } from "../types/setup";
import { QUANTITY_CAPS, capKeyForProduct, isCartEligible } from "./setupRules";

export const DELIVERY_MAX_LENGTH = 200;

/**
 * G3 rule: trim + non-empty + ≤ 200 chars. Returns the trimmed value when
 * valid, otherwise null. Shared by the summary input and hydration validation.
 */
export function validateDeliveryLocation(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > DELIVERY_MAX_LENGTH) {
    return null;
  }
  return trimmed;
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isSelectedProduct(
  skuNo: unknown,
  category: Product["category"],
  catalog: readonly Product[],
): skuNo is string {
  if (!isValidId(skuNo)) {
    return false;
  }
  const product = catalog.find((p) => p.skuNo === skuNo);
  return product?.category === category;
}

function isValidQuantities(
  quantities: unknown,
  catalog: readonly Product[],
): quantities is Record<string, number> {
  if (typeof quantities !== "object" || quantities === null || Array.isArray(quantities)) {
    return false;
  }
  const entries = Object.entries(quantities as Record<string, unknown>);
  if (entries.length === 0) {
    return true; // empty quantities are valid
  }
  return entries.every(([id, quantity]) => {
    const product = catalog.find((p) => p.skuNo === id);
    if (!product || !isCartEligible(product)) {
      return false; // unknown or partner id
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return false;
    }
    const cap = capKeyForProduct(product);
    if (cap !== null && quantity > QUANTITY_CAPS[cap]) {
      return false; // over cap (M1)
    }
    return true;
  });
}

/**
 * G1 hydration validation — the trust boundary between untrusted localStorage
 * and the rendered app (ADR 0004, threat model M1). Strict shape + business
 * rules; returns null on ANY violation so the caller can fall back to D1
 * defaults. Never crashes; never lets corrupt state through.
 */
export function validateSetupState(
  payload: unknown,
  catalog: readonly Product[],
): SetupState | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;

  const chairId =
    candidate.chairId === null || candidate.chairId === undefined ? null : candidate.chairId;
  const deskId =
    candidate.deskId === null || candidate.deskId === undefined ? null : candidate.deskId;

  // null = unselected, which is valid; only non-null ids are validated.
  if (chairId !== null && !isSelectedProduct(chairId, "chair", catalog)) {
    return null;
  }
  if (deskId !== null && !isSelectedProduct(deskId, "desk", catalog)) {
    return null;
  }
  if (!isValidQuantities(candidate.quantities, catalog)) {
    return null;
  }

  let deliveryLocation: string | undefined;
  if (candidate.deliveryLocation === undefined) {
    deliveryLocation = undefined;
  } else {
    const validated = validateDeliveryLocation(candidate.deliveryLocation);
    if (validated === null) {
      return null; // present but invalid (G3)
    }
    deliveryLocation = validated;
  }

  return { chairId, deskId, quantities: candidate.quantities, deliveryLocation };
}
