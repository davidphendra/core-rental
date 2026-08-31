import type { Product } from "../types/product";

/**
 * v1.14.0: catalog filtering moved server-side. This module is the single
 * source of the match predicates shared by the /api/products route (category +
 * q) and the AI designer's retriever (category + subCategory) — previously
 * each implemented its own filter.
 */

/** Builder categories the API accepts as a `?category=` filter (extra/partner
 * are not selectable in the builder, decision #20). */
export const CATALOG_FILTER_CATEGORIES = ["chair", "desk", "accessory"] as const;

export type CatalogFilterCategory = (typeof CATALOG_FILTER_CATEGORIES)[number];

export interface CatalogFilter {
  category?: CatalogFilterCategory | string;
  subCategory?: string;
  /** Case-insensitive substring on name OR description (Q3 ruling, moved server-side). */
  q?: string;
}

export function matchesCategoryFilter(product: Product, filter: CatalogFilter): boolean {
  if (filter.category !== undefined && product.category !== filter.category) return false;
  if (filter.subCategory !== undefined && product.subCategory !== filter.subCategory) {
    return false;
  }
  return true;
}

export function matchesQueryFilter(product: Product, q: string | undefined): boolean {
  const needle = (q ?? "").trim().toLowerCase();
  if (needle.length === 0) {
    return true;
  }
  return (
    product.name.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle)
  );
}

export function matchesCatalogFilter(product: Product, filter: CatalogFilter): boolean {
  return matchesCategoryFilter(product, filter) && matchesQueryFilter(product, filter.q);
}
