"use client";

import { useQuery } from "@tanstack/react-query";

import { logger } from "../observability/logger";
import type { Product } from "../types/product";
import { isValidCatalog, productsStaleTime } from "./products";
import type { CatalogFilterCategory } from "../domain/catalogFilter";

/** A builder selection view — category (+ optional keyword) narrowed server-side. */
export interface CatalogView {
  category: CatalogFilterCategory;
  q?: string;
}

async function fetchProductsView(view: CatalogView, signal?: AbortSignal): Promise<Product[]> {
  const params = new URLSearchParams({ category: view.category });
  const q = view.q?.trim() ?? "";
  if (q.length > 0) {
    params.set("q", q);
  }
  const startedAt = Date.now();
  try {
    const res = await fetch(`/api/products?${params.toString()}`, { signal });
    if (!res.ok) {
      throw new Error(`Products unavailable (${res.status})`);
    }
    // Trust boundary: validate the payload client-side too (no casts — G1 spirit).
    const payload: unknown = await res.json();
    if (!isValidCatalog(payload)) {
      throw new Error("Invalid catalog payload");
    }
    logger.info("catalog.view.loaded", {
      category: view.category,
      q: q.length > 0 ? q : undefined,
      products: payload.length,
      durationMs: Date.now() - startedAt,
    });
    return payload;
  } catch (error) {
    logger.error("catalog.view.failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

/**
 * v1.14.0: server-filtered catalog view for the builder Selection Panel.
 * Query key carries category + q so each view is cached independently (tab
 * switches are instant after first load; typing a query keys a fresh fetch).
 */
export function useProductsByCategory(view: CatalogView) {
  const q = view.q?.trim() ?? "";
  return useQuery({
    queryKey: ["products", "view", view.category, q] as const,
    // signal: TanStack aborts the in-flight request when the key changes
    // (typing a new q / switching tabs) — stale responses never land.
    queryFn: ({ signal }) => fetchProductsView({ ...view, q }, signal),
    staleTime: productsStaleTime,
  });
}
