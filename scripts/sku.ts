import { SKU_CODE_TO_CAP, type CapKey } from "../src/shared/domain/setupRules";
import type { ProductCategory } from "../src/shared/types/product";

/**
 * e09 sku generation — deterministic 12-char identifiers shared by the catalog
 * generator and the curated hero overlay. Mirrors the runtime tables in
 * setupRules (single source of truth lives there).
 */

/** category → 3-letter code for single-select categories. */
export const CATEGORY_CODES: Partial<Record<ProductCategory, string>> = {
  chair: "CHA",
  desk: "DSK",
  partner: "PTN",
};

/** capKey → 3-letter code (reverse of SKU_CODE_TO_CAP). */
export const CAP_KEY_CODES = Object.fromEntries(
  Object.entries(SKU_CODE_TO_CAP).map(([code, key]) => [key, code]),
) as Record<CapKey, string>;

/** FNV-1a 32-bit — deterministic, dependency-free. */
function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function base36(value: number, length: number): string {
  let out = "";
  let v = value >>> 0;
  for (let i = 0; i < length; i++) {
    out = B36[v % 36] + out;
    v = Math.floor(v / 36);
  }
  return out;
}

/**
 * Deterministic 12-char sku: 3-letter code + 9 alnum chars hashed from the
 * product name (two FNV passes for entropy). Stable across regenerations;
 * collision-free in practice for a ~50-product catalog (validated in the
 * generator, which throws on duplicates).
 */
export function computeSku(code: string, name: string): string {
  const key = name.toLowerCase();
  const a = base36(fnv1a(key), 5);
  const b = base36(fnv1a([...key].reverse().join(""), 0x9e3779b9), 4);
  return code + a + b;
}

/** 3-letter code for a category (or null when the category has no code). */
export function codeForCategory(category: ProductCategory): string | null {
  return CATEGORY_CODES[category] ?? null;
}

/** 3-letter code for a cap-bound accessory subtype (monitor → MON, …). */
export function codeForCapKey(capKey: CapKey): string {
  return CAP_KEY_CODES[capKey];
}
