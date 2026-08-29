import type { Page } from "@playwright/test";

import type { Product } from "../../src/shared/types/product";

import catalogJson from "../../src/shared/data/products.json";

/**
 * Catalog + expectation helpers (decision #37): E2E specs import the SAME
 * committed catalog the app serves and compute expected totals with plain
 * spec-local arithmetic — never importing app pricing/setupRules (a pricing
 * bug must fail the E2E, not echo itself).
 */
export const catalog = catalogJson as Product[];

function productBySku(skuNo: string): Product {
  const product = catalog.find((p) => p.skuNo === skuNo);
  if (product === undefined) {
    throw new Error(`Unknown product skuNo in test helper: ${id}`);
  }
  return product;
}

export function firstOfCategory(category: Product["category"]): Product {
  const product = catalog.find((p) => p.category === category);
  if (product === undefined) {
    throw new Error(`No product of category ${category}`);
  }
  return product;
}

export function nthOfCategory(category: Product["category"], index: number): Product {
  const product = catalog.filter((p) => p.category === category)[index];
  if (product === undefined) {
    throw new Error(`No ${category} at index ${index}`);
  }
  return product;
}

export function firstWithSkuPrefix(prefix: string): Product {
  const product = catalog.find((p) => p.skuNo.startsWith(prefix));
  if (product === undefined) {
    throw new Error(`No product with skuNo prefix ${prefix}`);
  }
  return product;
}

export function nthWithSkuPrefix(prefix: string, index: number): Product {
  const product = catalog.filter((p) => p.skuNo.startsWith(prefix))[index];
  if (product === undefined) {
    throw new Error(`No product with skuNo prefix ${prefix} at index ${index}`);
  }
  return product;
}

/** Matches the app's formatIdr (NBSP normalized to a regular space, #3). */
export function idr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/** Independent total computation from product ids + quantities (spec-local). */
export function computeTotal(items: { skuNo: string; quantity: number }[]): number {
  return items.reduce(
    (sum, { skuNo, quantity }) => sum + productBySku(skuNo).pricePerMonth * quantity,
    0,
  );
}

/** Fresh cart state per spec (N10 seeds corrupt data deliberately elsewhere). */
export async function resetStorage(page: Page): Promise<void> {
  await page.goto("/builder");
  await page.evaluate(() => window.localStorage.clear());
}
