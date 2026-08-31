import "server-only";

import type { Product } from "../types/product";
import { isValidCatalog } from "./products";

import catalogJson from "./products.json";

/**
 * Server-safe catalog read for server components and API routes (decision #25;
 * v1.14.0: products.json is isolated from the client bundle — browser code may
 * only reach catalog data via /api/products). Falls back to an empty list on
 * an invalid committed catalog; callers that need the malformed distinction
 * re-run isValidCatalog (the API route still 500s on the same condition — E2).
 */
let cachedCatalog: readonly Product[] | null = null;

export function getCatalog(): readonly Product[] {
  if (cachedCatalog === null) {
    cachedCatalog = isValidCatalog(catalogJson) ? catalogJson : [];
  }
  return cachedCatalog;
}
