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

export function productById(id: string): Product {
  const product = catalog.find((p) => p.id === id);
  if (product === undefined) {
    throw new Error(`Unknown product id in test helper: ${id}`);
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

export function firstWithIdPrefix(prefix: string): Product {
  const product = catalog.find((p) => p.id.startsWith(prefix));
  if (product === undefined) {
    throw new Error(`No product with id prefix ${prefix}`);
  }
  return product;
}

/** Matches the app's formatIdr (NBSP normalized to a regular space, #3). */
export function idr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/** Independent total computation from product ids + quantities (spec-local). */
export function computeTotal(items: { id: string; quantity: number }[]): number {
  return items.reduce((sum, { id, quantity }) => sum + productById(id).pricePerMonth * quantity, 0);
}

/** Fresh cart state per spec (N10 seeds corrupt data deliberately elsewhere). */
export async function resetStorage(page: Page): Promise<void> {
  await page.goto("/builder");
  await page.evaluate(() => window.localStorage.clear());
}
