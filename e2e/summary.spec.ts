import { expect, test } from "@playwright/test";

import {
  computeTotal,
  firstOfCategory,
  firstWithSkuPrefix,
  idr,
  resetStorage,
} from "./fixtures/catalog-helpers";

test.describe("summary + rent happy path (decision #35, #37)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("full journey: build → summary → rent → confirmation with matching items and total", async ({
    page,
  }) => {
    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    const monitor = firstWithSkuPrefix("MON");
    const delivery = "Villa Lotus, Canggu";

    // Build on /builder (D1 defaults select the first chair + desk).
    await page.goto("/builder");
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();
    await page.getByRole("tab", { name: "Accessories" }).click();
    const addMonitor = page.getByRole("button", { name: `Add ${monitor.name}` });
    await addMonitor.click();
    await addMonitor.click();

    await page.getByRole("link", { name: "View Setup Summary" }).click();
    await expect(page).toHaveURL(/\/summary$/);

    // Enter a valid delivery location → Rent becomes enabled.
    await page.getByLabel("Delivery Location").fill(delivery);
    const rent = page.getByRole("button", { name: /Rent This Setup/i });
    await expect(rent).toBeEnabled();
    await rent.click();

    // Demo-verification gate: type the phrase to confirm (C2).
    const dialog = page.getByRole("dialog", { name: "Confirm this is a demo" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "OK" })).toBeDisabled();
    await page.getByLabel("Confirmation phrase").fill("this is a demo");
    await page.getByRole("button", { name: "OK" }).click();

    // Confirmation shows the same items + total and echoes the delivery (C2/C4).
    await expect(page.getByText("Your request is in!")).toBeVisible();
    await expect(page.getByText(monitor.name)).toBeVisible();
    const expected = computeTotal([
      { skuNo: chair.skuNo, quantity: 1 },
      { skuNo: desk.skuNo, quantity: 1 },
      { skuNo: monitor.skuNo, quantity: 2 },
    ]);
    await expect(page.getByText(`${idr(expected)}/mo`)).toBeVisible();
    await expect(page.getByText(delivery)).toBeVisible();
    // Demo-honest: no payment language anywhere on the confirmation.
    await expect(page.getByText(/no payment taken/i)).toBeVisible();

    // The order was removed from storage: returning to /summary shows the
    // empty state (fresh cart, D1 re-applies on the builder).
    await page.goto("/summary");
    await expect(page.getByText("Your workspace is empty")).toBeVisible();
  });

  test("wrong demo phrase shows an error and keeps OK disabled", async ({ page }) => {
    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    await page.addInitScript(
      (args) => {
        const { key, setup } = args as { key: string; setup: string };
        localStorage.setItem(key, setup);
      },
      {
        key: "core-rental:setup:v2",
        setup: JSON.stringify({ chairId: chair.skuNo, deskId: desk.skuNo, quantities: {} }),
      },
    );

    await page.goto("/summary");
    await page.getByLabel("Delivery Location").fill("Villa Lotus, Canggu");
    await page.getByRole("button", { name: /Rent This Setup/i }).click();

    const input = page.getByLabel("Confirmation phrase");
    await input.fill("wrong phrase");
    await input.blur();
    await expect(page.getByText(/doesn't match/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "OK" })).toBeDisabled();
    await expect(page.getByText("Your request is in!")).toHaveCount(0);

    // Matching phrase (case-insensitive) enables OK and confirms.
    await input.fill("THIS IS A DEMO");
    await expect(page.getByRole("button", { name: "OK" })).toBeEnabled();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("Your request is in!")).toBeVisible();
  });
});

test.describe("summary negative flows (N1, N11)", () => {
  test("N1: an empty cart shows the friendly empty state with a CTA", async ({ page }) => {
    await page.goto("/summary");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page.getByText("Your workspace is empty")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start building" })).toHaveAttribute(
      "href",
      "/builder",
    );
  });

  test("N11: delivery input validation gates Rent (G3)", async ({ page }) => {
    const chair = firstOfCategory("chair");
    const desk = firstOfCategory("desk");
    // Seed a valid cart so the receipt renders.
    await page.addInitScript(
      (args) => {
        const { key, setup } = args as { key: string; setup: string };
        localStorage.setItem(key, setup);
      },
      {
        key: "core-rental:setup:v2",
        setup: JSON.stringify({ chairId: chair.skuNo, deskId: desk.skuNo, quantities: {} }),
      },
    );

    await page.goto("/summary");
    await expect(page.getByText("Monthly Total")).toBeVisible();

    const input = page.getByLabel("Delivery Location");
    const rent = page.getByRole("button", { name: /Rent This Setup/i });
    await expect(rent).toBeDisabled();

    // Over-length → inline error (after blur, like a real user) + still disabled.
    await input.fill("x".repeat(201));
    await input.blur();
    await expect(page.getByText(/200 characters or fewer/)).toBeVisible();
    await expect(rent).toBeDisabled();

    // Valid → error clears, Rent enabled.
    await input.fill("Villa Lotus, Canggu");
    await expect(page.getByText(/200 characters or fewer/)).toHaveCount(0);
    await expect(rent).toBeEnabled();
  });
});
