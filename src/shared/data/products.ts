import type { Product } from "../types/product";
import catalogJson from "./products.json";

/** TanStack Query key for the catalog (single source, cached across navigation). */
export const productsQueryKey = ["products"] as const;

/** Client-side staleness for the catalog (decision #25). */
export const productsStaleTime = 5 * 60 * 1000;

/**
 * Server-safe catalog read for server components (decision #25: home stays a
 * server component). Falls back to an empty list on an invalid committed
 * catalog (the API route still 500s on the same condition — E2).
 */
let cachedCatalog: readonly Product[] | null = null;

export function getCatalog(): readonly Product[] {
  if (cachedCatalog === null) {
    cachedCatalog = isValidCatalog(catalogJson) ? catalogJson : [];
  }
  return cachedCatalog;
}

export function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.pricePerMonth === "number" &&
    Number.isInteger(p.pricePerMonth) &&
    p.pricePerMonth > 0 &&
    typeof p.description === "string" &&
    typeof p.image === "string"
  );
}

/**
 * Contract guard for the committed catalog (E2). Rejects empty, non-array, or
 * malformed payloads so the API never serves a broken 200.
 */
export function isValidCatalog(value: unknown): value is Product[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  return value.every(isProduct);
}
