import { expect, test } from "@playwright/test";

import { firstOfCategory } from "./fixtures/catalog-helpers";

const STORAGE_KEY = "core-rental:setup:v2";

test.describe("resilience negative flows (N7, N8, N10)", () => {
  test("N7: a broken product image falls back to the local SVG", async ({ page }) => {
    // Abort both external hero images and generated placeholders — every image
    // must degrade to the local fallback (decision #31).
    await page.route(/lh3\.googleusercontent\.com/, (route) => route.abort());
    await page.route("**/placeholders/**", (route) => route.abort());

    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: firstOfCategory("chair").name })).toBeVisible();

    const firstImage = page.locator("article img").first();
    await expect(firstImage).toHaveAttribute("src", /\/fallback\/product\.svg/);
  });

  test("N8: a failed catalog API shows the friendly error state (never a crash)", async ({
    page,
  }) => {
    await page.route("**/api/products", (route) => route.abort());

    await page.goto("/builder");
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toContainText("couldn't load the catalog", {
      timeout: 15_000, // TanStack retries (~7s) precede the error state
    });
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("N10: corrupt localStorage falls back to D1 defaults without crashing (G1)", async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({ chairId: "hacker", deskId: "ghost", quantities: { nope: 99 } }),
      );
    }, STORAGE_KEY);

    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: firstOfCategory("chair").name })).toBeVisible();
    const firstChairCard = page
      .locator("article")
      .filter({ hasText: firstOfCategory("chair").name });
    await expect(
      firstChairCard.getByRole("button", { name: "Deselect", exact: true }),
    ).toBeVisible();
  });
});
