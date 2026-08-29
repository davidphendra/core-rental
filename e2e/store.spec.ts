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
    await page.goto("/store");
    // Only three category tabs remain (extras removed from the store).
    await expect(page.getByRole("tab")).toHaveCount(3);
    await expect(page.getByRole("tab", { name: "Extras" })).toHaveCount(0);

    await expect(page.getByRole("button", { name: /Add .* to setup/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Request/ })).toHaveCount(0);
  });

  test("N6: extras + partner products never appear in the store or the summary", async ({
    page,
  }) => {
    const chair = firstOfCategory("chair");

    // Build a valid cart first (D1 defaults apply + persist on /builder).
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Chairs" }).click();
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();

    // The store lists only chair/desk/accessory (3 tabs, no Extras).
    await page.goto("/store");
    await expect(page.getByRole("tab")).toHaveCount(3);
    await expect(page.getByRole("tab", { name: "Extras" })).toHaveCount(0);
    await expect(page.getByText("Surfboard", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Motorcycle Rental")).toHaveCount(0);
    await expect(page.getByText("Partner Service", { exact: true })).toHaveCount(0);

    // The summary shows the workspace setup — never extras or the motorcycle (N6).
    await page.goto("/summary");
    await expect(page.getByText("Monthly Total")).toBeVisible();
    await expect(page.getByText("Motorcycle Rental")).toHaveCount(0);
  });
});
