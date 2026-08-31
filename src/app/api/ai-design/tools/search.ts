import { jsonSchema } from "ai";

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
 * v1.15.0 (grill Q1=b): the catalog is reached ONLY through the /api/products
 * contract — the endpoint does the filtering (category + subCategory); this
 * tool just shapes the response. subCategory implies category=accessory
 * (normalized here — the endpoint requires the pairing, Q2=b). A non-200,
 * network failure, or malformed payload → empty list, never a crash (same
 * guarantee as the in-process retriever). Lean payload preserved: ≤8 hits,
 * 60-char descriptions, so model roundtrips stay fast.
 */
export async function searchCatalog(
  args: SearchCatalogArgs,
  origin: string,
): Promise<CatalogHit[]> {
  const params = new URLSearchParams();
  const category =
    args.subCategory !== undefined && args.category === undefined ? "accessory" : args.category;
  if (category !== undefined) params.set("category", category);
  if (args.subCategory !== undefined) params.set("subCategory", args.subCategory);
  const qs = params.toString();

  let res: Response;
  try {
    res = await fetch(`${origin}/api/products${qs.length > 0 ? `?${qs}` : ""}`);
  } catch {
    return [];
  }
  if (!res.ok) {
    return [];
  }
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(payload)) {
    return [];
  }
  const products = payload as Array<Partial<Product>>;
  return products.slice(0, 8).map((p) => ({
    skuNo: String(p.skuNo ?? ""),
    name: String(p.name ?? "Unnamed"),
    pricePerMonth: typeof p.pricePerMonth === "number" ? p.pricePerMonth : 0,
    description:
      (p.description ?? "").length > 60
        ? `${String(p.description).slice(0, 57)}…`
        : String(p.description ?? ""),
  }));
}
