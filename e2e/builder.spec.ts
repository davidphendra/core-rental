import { expect, test } from "@playwright/test";

import {
  computeTotal,
  firstOfCategory,
  firstWithIdPrefix,
  idr,
  nthOfCategory,
  resetStorage,
} from "./fixtures/catalog-helpers";

test.describe("builder happy path (decision #35)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("build a setup: select chair + desk, stack 2 monitors, verify the live IDR total", async ({
    page,
  }) => {
    const chair = nthOfCategory("chair", 1); // the second chair (exclusivity swap)
    const desk = firstOfCategory("desk");
    const monitor = firstWithIdPrefix("accessory-monitor-");

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

    // Accessories tab → add 2 monitors via the stepper.
    await page.getByRole("tab", { name: "Accessories" }).click();
    const addMonitor = page.getByRole("button", { name: `Add ${monitor.name}` });
    await addMonitor.click();
    await addMonitor.click();

    // Sticky bar shows the live total (displayed-value verification).
    const expected = computeTotal([
      { id: chair.id, quantity: 1 },
      { id: desk.id, quantity: 1 },
      { id: monitor.id, quantity: 2 },
    ]);
    await expect(page.getByText(`${idr(expected)}/mo`)).toBeVisible();
  });

  test("navigating to the summary shows the same line items and total", async ({ page }) => {
    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    const monitor = firstWithIdPrefix("accessory-monitor-");

    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();
    await page.getByRole("tab", { name: "Accessories" }).click();
    const addMonitor = page.getByRole("button", { name: `Add ${monitor.name}` });
    await addMonitor.click();
    await addMonitor.click();

    await page.getByRole("link", { name: "View Setup Summary" }).click();
    await expect(page).toHaveURL(/\/summary$/);

    await expect(page.getByText(monitor.name)).toBeVisible();
    await expect(page.getByText("Qty: 2")).toBeVisible();

    const expected = computeTotal([
      { id: chair.id, quantity: 1 },
      { id: desk.id, quantity: 1 },
      { id: monitor.id, quantity: 2 },
    ]);
    await expect(page.getByText(`${idr(expected)}/mo`)).toBeVisible();
  });
});

test.describe("builder negative flows (N3, N4, N5)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("a canvas slot can be removed directly via its × button", async ({ page }) => {
    await page.goto("/builder");
    await expect(page.getByRole("button", { name: "Add Monitor" })).toBeVisible();
    await page.getByRole("button", { name: "Add Monitor" }).click();
    await expect(page.getByRole("button", { name: "Monitor: 1" })).toBeVisible();
    await page.getByRole("button", { name: "Remove Monitor" }).click();
    await expect(page.getByRole("button", { name: "Add Monitor" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Remove Monitor/ })).toHaveCount(0);
  });

  test("N3: the stepper disables at cap", async ({ page }) => {
    const monitor = firstWithIdPrefix("accessory-monitor-");
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Accessories" }).click();
    const addMonitor = page.getByRole("button", { name: `Add ${monitor.name}` });
    await addMonitor.click();
    await addMonitor.click();
    await addMonitor.click();
    await expect(addMonitor).toBeDisabled(); // cap 3 (decision #22)
  });

  test("N4: removing an item decreases the total", async ({ page }) => {
    const monitor = firstWithIdPrefix("accessory-monitor-");
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Accessories" }).click();
    const addMonitor = page.getByRole("button", { name: `Add ${monitor.name}` });
    await addMonitor.click();
    await addMonitor.click();
    await page.getByRole("button", { name: `Remove ${monitor.name}` }).click();

    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    const expected = computeTotal([
      { id: chair.id, quantity: 1 },
      { id: desk.id, quantity: 1 },
      { id: monitor.id, quantity: 1 },
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
    await expect(canvas.getByRole("img", { name: "No chair selected" })).toBeVisible();
    // Desk too.
    await page.getByRole("button", { name: "Remove desk" }).click();
    await expect(canvas.getByRole("img", { name: "No desk selected" })).toBeVisible();
  });
});
