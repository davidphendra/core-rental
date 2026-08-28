import { expect, test } from "@playwright/test";

import { firstOfCategory, resetStorage } from "./fixtures/catalog-helpers";

test.describe("store catalog gallery (decision #32)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("browse the catalog by category", async ({ page }) => {
    const chair = firstOfCategory("chair");
    const accessory = firstOfCategory("accessory");

    await page.goto("/store");
    // Default tab is Chairs.
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: accessory.name })).toHaveCount(0);

    await page.getByRole("tab", { name: "Accessories" }).click();
    await expect(page.getByRole("heading", { name: accessory.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: chair.name })).toHaveCount(0);
  });

  test("cards are display-only: no Add or Request buttons anywhere", async ({ page }) => {
    const surfboard = firstOfCategory("extra");

    await page.goto("/store");
    await page.getByRole("tab", { name: "Extras" }).click();
    await expect(page.getByRole("heading", { name: surfboard.name })).toBeVisible();

    await expect(page.getByRole("button", { name: /Add .* to setup/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Request/ })).toHaveCount(0);
  });

  test("N6: the motorcycle is display-only and never appears in the summary", async ({ page }) => {
    const motorcycle = firstOfCategory("partner");
    const chair = firstOfCategory("chair");

    // Build a valid cart first (D1 defaults apply + persist on /builder).
    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();

    // The store shows the motorcycle as an informational card — no affordance.
    await page.goto("/store");
    await page.getByRole("tab", { name: "Extras" }).click();
    await expect(page.getByRole("heading", { name: motorcycle.name })).toBeVisible();
    await expect(page.getByText("Partner Service", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add .* to setup/ })).toHaveCount(0);

    // The summary shows the workspace setup — never the motorcycle (N6).
    await page.goto("/summary");
    await expect(page.getByText("Monthly Total")).toBeVisible();
    await expect(page.getByText(motorcycle.name)).toHaveCount(0);
  });
});
