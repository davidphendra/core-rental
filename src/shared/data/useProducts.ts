"use client";

import { useQuery } from "@tanstack/react-query";

import type { Product } from "../types/product";
import { isValidCatalog, productsQueryKey, productsStaleTime } from "./products";

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) {
    throw new Error(`Products unavailable (${res.status})`);
  }
  // Trust boundary: validate the payload client-side too (no casts — G1 spirit).
  const payload: unknown = await res.json();
  if (!isValidCatalog(payload)) {
    throw new Error("Invalid catalog payload");
  }
  return payload;
}

/** Catalog data (decision #25): TanStack Query client fetch, cache survives navigation. */
export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
    staleTime: productsStaleTime,
  });
}
