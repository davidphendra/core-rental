import { getCatalog } from "@/shared/data/catalog.server";
import { isValidCatalog } from "@/shared/data/products";
import type { Product } from "@/shared/types/product";

/**
 * Catalog API (decisions #25, E2): static import of the committed catalog means
 * no runtime I/O failure mode; the contract guard ensures a malformed committed
 * catalog is never served as a 200. Generic 500 message — no internals (S1).
 * v1.14.0: filtering moved server-side (?category, ?q) — see route below.
 */
export function GET(): Response {
  const catalog = getCatalog();
  const valid: Product[] | null = isValidCatalog(catalog) ? catalog : null;

  if (valid === null) {
    return Response.json({ error: "Products unavailable" }, { status: 500 });
  }

  return Response.json(valid);
}
