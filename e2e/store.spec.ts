import { expect, test } from "@playwright/test";

import { firstOfCategory, firstWithIdPrefix, resetStorage } from "./fixtures/catalog-helpers";

test.describe("store happy path (decision #35, #20)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("add the surfboard extra from the store", async ({ page }) => {
    const surfboard = firstOfCategory("extra");

    await page.goto("/store");
    await page.getByRole("tab", { name: "Extras" }).click();

    const addSurfboard = page.getByRole("button", { name: `Add ${surfboard.name} to setup` });
    await expect(addSurfboard).toBeVisible();
    await addSurfboard.click();
    await expect(addSurfboard).toHaveText(/Added/);
  });

  test("request the partner motorcycle via its modal (N6: never in the cart)", async ({ page }) => {
    const motorcycle = firstOfCategory("partner");

    await page.goto("/store");
    await page.getByRole("tab", { name: "Extras" }).click();

    await page.getByRole("button", { name: `Request rental for ${motorcycle.name}` }).click();
    await expect(page.getByRole("dialog", { name: motorcycle.name })).toBeVisible();
    await page.getByRole("button", { name: "Request Rental", exact: true }).click();
    await expect(page.getByText("Request received")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("store negative flows (N6)", () => {
  test("N6: the motorcycle never appears in the summary", async ({ page }) => {
    const motorcycle = firstOfCategory("partner");
    const chair = firstOfCategory("chair");

    // Build a valid cart first (D1 defaults apply + persist on /builder).
    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();

    // Request the partner motorcycle.
    await page.goto("/store");
    await page.getByRole("tab", { name: "Extras" }).click();
    await page.getByRole("button", { name: `Request rental for ${motorcycle.name}` }).click();
    await page.getByRole("button", { name: "Request Rental", exact: true }).click();
    await expect(page.getByText("Request received")).toBeVisible();

    // The summary shows the workspace setup — never the motorcycle (decision #20).
    await page.goto("/summary");
    await expect(page.getByText("Monthly Total")).toBeVisible();
    await expect(page.getByText(motorcycle.name)).toHaveCount(0);
  });
});
