import { getCatalog } from "@/shared/data/catalog.server";
import { isValidCatalog } from "@/shared/data/products";
import { CATALOG_FILTER_CATEGORIES, matchesCatalogFilter } from "@/shared/domain/catalogFilter";
import { PRODUCT_SUB_CATEGORIES } from "@/shared/types/product";
import type { Product } from "@/shared/types/product";

/**
 * Catalog API (decisions #25, E2): static import of the committed catalog means
 * no runtime I/O failure mode; the contract guard ensures a malformed committed
 * catalog is never served as a 200. Generic 500 message — no internals (S1).
 * v1.14.0: filtering moved server-side — ?category (desk|chair|accessory) and
 * ?q (case-insensitive substring on name/description) are applied here; the
 * browser no longer filters the full catalog client-side.
 */
export function GET(request?: Request): Response {
  const catalog = getCatalog();
  const valid: Product[] | null = isValidCatalog(catalog) ? catalog : null;

  if (valid === null) {
    return Response.json({ error: "Products unavailable" }, { status: 500 });
  }

  const url = new URL(request?.url ?? "http://localhost/api/products");
  const category = url.searchParams.get("category");
  if (category !== null && !CATALOG_FILTER_CATEGORIES.includes(category as never)) {
    return Response.json({ error: `Invalid category` }, { status: 400 });
  }
  const q = url.searchParams.get("q") ?? undefined;
  const subCategory = url.searchParams.get("subCategory");

  // v1.15.0: subCategory is only meaningful on accessories — require the
  // explicit category=accessory pairing (grill Q2=b) and a known value.
  if (subCategory !== null) {
    if (category !== "accessory" || !PRODUCT_SUB_CATEGORIES.includes(subCategory as never)) {
      return Response.json({ error: "Invalid subCategory" }, { status: 400 });
    }
  }

  const filtered = valid.filter((p) =>
    matchesCatalogFilter(p, {
      category: category ?? undefined,
      subCategory: subCategory ?? undefined,
      q,
    }),
  );
  return Response.json(filtered);
}
