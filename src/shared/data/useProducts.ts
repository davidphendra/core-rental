"use client";

import { useQuery } from "@tanstack/react-query";

import { logger } from "../observability/logger";
import type { Product } from "../types/product";
import { isValidCatalog, productsQueryKey, productsStaleTime } from "./products";

async function fetchProducts(): Promise<Product[]> {
  const startedAt = Date.now();
  try {
    const res = await fetch("/api/products");
    if (!res.ok) {
      throw new Error(`Products unavailable (${res.status})`);
    }
    // Trust boundary: validate the payload client-side too (no casts — G1 spirit).
    const payload: unknown = await res.json();
    if (!isValidCatalog(payload)) {
      throw new Error("Invalid catalog payload");
    }
    logger.info("catalog.loaded", {
      products: payload.length,
      durationMs: Date.now() - startedAt,
    });
    return payload;
  } catch (error) {
    logger.error("catalog.failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

/** Catalog data (decision #25): TanStack Query client fetch, cache survives navigation. */
export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
    staleTime: productsStaleTime,
  });
}
