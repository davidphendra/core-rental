import { expect, test } from "@playwright/test";

import {
  computeTotal,
  firstOfCategory,
  firstWithSkuPrefix,
  nthWithSkuPrefix,
  idr,
  nthOfCategory,
  resetStorage,
} from "./fixtures/catalog-helpers";

test.describe("builder happy path (decision #35)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("the panel search filters products by keyword (name/description)", async ({ page }) => {
    await page.goto("/builder");
    const meshChair = firstOfCategory("chair"); // first chair; its description contains "mesh"
    const taskChair = nthOfCategory("chair", 1);
    // Search by name (case-insensitive).
    await page.getByRole("searchbox", { name: "Search chairs" }).fill(taskChair.name.toLowerCase());
    await expect(page.getByRole("heading", { name: taskChair.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: meshChair.name })).toHaveCount(0);
    // Clear button restores the list.
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.getByRole("heading", { name: meshChair.name })).toBeVisible();
  });

  test("build a setup: select chair + desk, stack 2 monitors, verify the live IDR total", async ({
    page,
  }) => {
    const chair = nthOfCategory("chair", 1); // the second chair (exclusivity swap)
    const desk = firstOfCategory("desk");
    const monitor = firstWithSkuPrefix("MON");

    await page.goto("/builder");
    // Panel loaded (chairs listed).
    await expect(page.getByRole("heading", { name: firstOfCategory("chair").name })).toBeVisible();

    // Swap to the second chair via its card.
    const chairCard = page.locator("article").filter({ hasText: chair.name });
    await chairCard.getByRole("button", { name: "Select", exact: true }).click();
    await expect(chairCard.getByRole("button", { name: "Deselect", exact: true })).toBeVisible();

    // Desks tab → the first desk is already pre-selected by D1 defaults.
    await page.getByRole("tab", { name: "Desks" }).click();
    const deskCard = page.locator("article").filter({ hasText: desk.name });
    await expect(deskCard.getByRole("button", { name: "Deselect", exact: true })).toBeVisible();

    // Accessories tab → add 2 monitors via the slot Select (e09s02).
    await page.getByRole("tab", { name: "Accessories" }).click();
    const monitorCard = page.locator("article").filter({ hasText: monitor.name });
    const selectMonitor = monitorCard.getByRole("button", { name: "Select", exact: true });
    await selectMonitor.click();
    await selectMonitor.click();

    // Sticky bar shows the live total (displayed-value verification).
    const expected = computeTotal([
      { skuNo: chair.skuNo, quantity: 1 },
      { skuNo: desk.skuNo, quantity: 1 },
      { skuNo: monitor.skuNo, quantity: 2 },
    ]);
    await expect(page.getByText(`${idr(expected)}/mo`)).toBeVisible();
  });

  test("navigating to the summary shows the same line items and total", async ({ page }) => {
    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    const monitor = firstWithSkuPrefix("MON");

    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();
    await page.getByRole("tab", { name: "Accessories" }).click();
    const monitorCard = page.locator("article").filter({ hasText: monitor.name });
    const selectMonitor = monitorCard.getByRole("button", { name: "Select", exact: true });
    await selectMonitor.click();
    await selectMonitor.click();

    await page.getByRole("link", { name: "View Setup Summary" }).click();
    await expect(page).toHaveURL(/\/summary$/);

    await expect(page.getByText(monitor.name)).toBeVisible();
    await expect(page.getByText("Qty: 2")).toBeVisible();

    const expected = computeTotal([
      { skuNo: chair.skuNo, quantity: 1 },
      { skuNo: desk.skuNo, quantity: 1 },
      { skuNo: monitor.skuNo, quantity: 2 },
    ]);
    await expect(page.getByText(`${idr(expected)}/mo`)).toBeVisible();
  });
});

test.describe("builder negative flows (N3, N4, N5)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("a monitor slot can be removed directly via its × button (e09s02)", async ({ page }) => {
    await page.goto("/builder");
    await expect(page.getByRole("button", { name: "Add Monitor" })).toHaveCount(3);
    await page.getByRole("button", { name: "Add Monitor" }).first().click();
    await expect(page.getByRole("button", { name: "Remove Monitor" })).toHaveCount(1);
    await page.getByRole("button", { name: "Remove Monitor" }).click();
    await expect(page.getByRole("button", { name: "Remove Monitor" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add Monitor" })).toHaveCount(3);
  });

  test("N3: the monitor row caps at 3 slots (e09s02)", async ({ page }) => {
    const monitor = firstWithSkuPrefix("MON");
    const monitor2 = nthWithSkuPrefix("MON", 1);
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Accessories" }).click();
    const selectCard = (m: typeof monitor) =>
      page
        .locator("article")
        .filter({ hasText: m.name })
        .getByRole("button", { name: "Select", exact: true });
    // Fill all 3 slots with the same model (3C).
    for (let i = 0; i < 3; i++) await selectCard(monitor).click();
    await expect(page.getByRole("button", { name: "Add Monitor" })).toHaveCount(0);
    // A 4th select on a different model REPLACES the most recently added (Q1)
    // — the row stays at 3 cards, never grows past the cap.
    await selectCard(monitor2).click();
    await expect(page.getByRole("button", { name: "Remove Monitor" })).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Add Monitor" })).toHaveCount(0);
    // Replace-always ruling: selecting an already-placed model ALSO replaces
    // the most recently added card (row was [A,A,M2] -> [A,A,A]; 2A from full).
    await selectCard(monitor).click();
    await expect(page.getByRole("button", { name: "Remove Monitor" })).toHaveCount(3);
  });

  test("N4: removing a monitor decreases the total", async ({ page }) => {
    const monitor = firstWithSkuPrefix("MON");
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Accessories" }).click();
    const monitorCard = page.locator("article").filter({ hasText: monitor.name });
    const selectMonitor = monitorCard.getByRole("button", { name: "Select", exact: true });
    await selectMonitor.click();
    await selectMonitor.click();
    await page.getByRole("button", { name: "Remove Monitor" }).first().click();

    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    const expected = computeTotal([
      { skuNo: chair.skuNo, quantity: 1 },
      { skuNo: desk.skuNo, quantity: 1 },
      { skuNo: monitor.skuNo, quantity: 1 },
    ]);
    await expect(page.getByText(`${idr(expected)}/mo`)).toBeVisible();
  });

  test("N5: selecting a second chair replaces the first (exclusivity)", async ({ page }) => {
    const chairA = firstOfCategory("chair");
    const chairB = nthOfCategory("chair", 1);
    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chairA.name })).toBeVisible();

    const cardA = page.locator("article").filter({ hasText: chairA.name });
    const cardB = page.locator("article").filter({ hasText: chairB.name });
    // chairA is pre-selected by D1 defaults; selecting chairB replaces it.
    await cardB.getByRole("button", { name: "Select", exact: true }).click();

    await expect(cardB.getByRole("button", { name: "Deselect", exact: true })).toBeVisible();
    await expect(cardA.getByRole("button", { name: "Select", exact: true })).toBeVisible(); // N5
  });

  test("the canvas chair and desk × buttons remove them directly", async ({ page }) => {
    const chair = firstOfCategory("chair");
    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();

    const canvas = page.locator('div[class*="rounded-[2rem]"]');
    // Chair is selected by D1 defaults — remove it via its ×.
    await page.getByRole("button", { name: "Remove chair" }).click();
    await expect(canvas.getByRole("button", { name: "Add a chair from the panel" })).toBeVisible();
    // Desk too — the table layout stays, only the product image is removed.
    await page.getByRole("button", { name: "Remove desk" }).click();
    await expect(canvas.getByRole("img", { name: "Desk table" })).toBeVisible();
    await expect(canvas.getByText("Add a desk from the panel")).toBeVisible();
  });
});
