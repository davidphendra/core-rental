import { jsonSchema } from "ai";

import { matchesCategoryFilter } from "@/shared/domain/catalogFilter";
import type { Product, ProductSubCategory } from "@/shared/types/product";

/**
 * llama.cpp-safe tool schemas (S2 wire compat): LM Studio's schema parser
 * rejects zod's generated keywords ($schema, additionalProperties, pattern,
 * maxItems, anyOf). These minimal JSON schemas only steer the model — strict
 * validation happens server-side in validateDesign.
 */
export const searchParamsSchema = jsonSchema<SearchCatalogArgs>({
  type: "object",
  properties: {
    category: { type: "string", enum: ["chair", "desk", "accessory"] },
    subCategory: { type: "string", enum: ["monitor", "lamp", "plant", "coffee", "beanbag"] },
  },
});

export interface SearchCatalogArgs {
  /** Coarse category: chair | desk | accessory. */
  category?: "chair" | "desk" | "accessory";
  /** Fine type for accessories (subCategory implies accessory). */
  subCategory?: ProductSubCategory;
}

export interface CatalogHit {
  skuNo: string;
  name: string;
  pricePerMonth: number;
  description: string;
}

/**
 * Pure category/subCategory retriever (user ruling: the query filter was
 * useless — the LLM does all semantic matching/ranking). Every valid combo is
 * guaranteed non-empty (each type has 6–10 products; subCategory implies
 * accessory by construction). Lean payload: ≤8 hits, 60-char descriptions, so
 * model roundtrips stay fast. Invalid enums match nothing → empty, never a
 * crash. The match predicate is shared with the /api/products route
 * (catalogFilter — single source, no duplicated filter logic).
 */
export function searchCatalog(args: SearchCatalogArgs, catalog: readonly Product[]): CatalogHit[] {
  const hits = catalog.filter((p) => matchesCategoryFilter(p, args));
  return hits.slice(0, 8).map((p) => ({
    skuNo: p.skuNo,
    name: p.name,
    pricePerMonth: p.pricePerMonth,
    description: p.description.length > 60 ? `${p.description.slice(0, 57)}…` : p.description,
  }));
}
