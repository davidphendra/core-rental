import { capKeyForProduct } from "../domain/setupRules";
import type { Product } from "../types/product";
import { PRODUCT_SUB_CATEGORIES, SKU_PATTERN, type ProductSubCategory } from "../types/product";

/** TanStack Query key for the catalog (single source, cached across navigation). */
export const productsQueryKey = ["products"] as const;

/** Client-side staleness for the catalog (decision #25). */
export const productsStaleTime = 5 * 60 * 1000;

export function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const p = value as Record<string, unknown>;
  if (
    typeof p.skuNo !== "string" ||
    !SKU_PATTERN.test(p.skuNo) ||
    typeof p.name !== "string" ||
    typeof p.pricePerMonth !== "number" ||
    !Number.isInteger(p.pricePerMonth) ||
    p.pricePerMonth <= 0 ||
    typeof p.description !== "string" ||
    typeof p.image !== "string"
  ) {
    return false;
  }
  // subCategory: required — null on chair/desk/partner, one of the five on
  // accessories, and MUST match the sku prefix (single source of truth).
  if (typeof p.subCategory !== "string" && p.subCategory !== null) {
    return false;
  }
  if (
    p.subCategory !== null &&
    !PRODUCT_SUB_CATEGORIES.includes(p.subCategory as ProductSubCategory)
  ) {
    return false;
  }
  return p.subCategory === capKeyForProduct(p as unknown as Product);
}

/**
 * Contract guard for the committed catalog (E2). Rejects empty, non-array,
 * malformed payloads, or duplicate skus so the API never serves a broken 200.
 */
export function isValidCatalog(value: unknown): value is Product[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  if (!value.every(isProduct)) {
    return false;
  }
  const skus = new Set(value.map((p) => p.skuNo));
  return skus.size === value.length; // skus unique (e09 contract)
}
