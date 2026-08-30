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

  test("the Accessories tab shows the Misc group with coffee + beanbag (misc products)", async ({
    page,
  }) => {
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Accessories" }).click();
    await expect(page.getByText("misc")).toBeVisible();
    const coffee = firstWithSkuPrefix("CFE");
    const beanbag = firstWithSkuPrefix("BBG");
    await expect(page.getByRole("heading", { name: coffee.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: beanbag.name })).toBeVisible();
    // Single-select Select buttons (replace semantics), not steppers.
    await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
  });

  test("a filled zone click increments the SELECTED machine and shows Max at cap", async ({
    page,
  }) => {
    const espresso = firstWithSkuPrefix("CFE"); // first coffee = Espresso Machine
    await page.goto("/builder");
    await page.getByRole("tab", { name: "Accessories" }).click();
    // Select Espresso Machine via its Misc Select button (single-select, cap 1).
    const espressoCard = page.locator("article").filter({ hasText: espresso.name });
    await espressoCard.getByRole("button", { name: "Select", exact: true }).click();
    await expect(page.getByRole("button", { name: "Coffee Station", exact: true })).toBeVisible();
    await expect(page.getByText("Max", { exact: true })).toBeVisible();
    // Clicking the filled zone must NOT swap to another coffee — stays at 1.
    await page.getByRole("button", { name: "Coffee Station", exact: true }).click();
    await expect(page.getByRole("button", { name: "Coffee Station", exact: true })).toBeVisible();
    // The zone card still shows the selected machine (scoped to the zone button).
    await expect(
      page.getByRole("button", { name: "Coffee Station", exact: true }).getByRole("img"),
    ).toHaveAttribute("alt", espresso.name);
  });

  test("the panel search filters products by keyword (name/description)", async ({ page }) => {
    await page.goto("/builder");
    const meshChair = firstOfCategory("chair"); // first chair; its description contains "mesh"
    const taskChair = nthOfCategory("chair", 1);
    // Search by name (case-insensitive) — Chairs is the second tab now.
    await page.getByRole("tab", { name: "Chairs" }).click();
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
    // Panel loaded — activate the Chairs tab (desks are first now).
    await page.getByRole("tab", { name: "Chairs" }).click();
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
    await page.getByRole("tab", { name: "Chairs" }).click();
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
    await page.getByRole("tab", { name: "Chairs" }).click();
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
    await page.getByRole("tab", { name: "Chairs" }).click();
    await expect(page.getByRole("heading", { name: chair.name })).toBeVisible();

    const canvas = page.locator('div[class*="rounded-[2rem]"]');
    // Chair is selected by D1 defaults — remove it via its ×.
    await page.getByRole("button", { name: "Remove chair" }).click();
    await expect(canvas.getByRole("button", { name: "Add Chair" })).toBeVisible();
    // Desk too — the table layout stays, only the product image is removed.
    await page.getByRole("button", { name: "Remove desk" }).click();
    await expect(canvas.getByRole("img", { name: "Desk table" })).toBeVisible();
    await expect(canvas.getByText("Add Desk")).toBeVisible();

    // UX ruling: with no chair+desk the summary CTA disables and the header
    // bag is inert (aria-disabled, not a link).
    const cta = page.getByRole("button", { name: "View Setup Summary" });
    await expect(cta).toBeDisabled();
    await expect(page.getByLabel("View your setup")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("link", { name: "View your setup" })).toHaveCount(0);
  });
});

test.describe("Design with AI (e10s02)", () => {
  const chair = firstWithSkuPrefix("CHA");
  const desk = firstWithSkuPrefix("DSK");
  const monitor = firstWithSkuPrefix("MON");

  const design = {
    chairSku: chair.skuNo,
    deskSku: desk.skuNo,
    monitorSkus: [monitor.skuNo],
    coffeeSku: null,
    beanbagSku: null,
    lampSku: null,
    plantSku: null,
    totalPerMonth: chair.pricePerMonth + desk.pricePerMonth + monitor.pricePerMonth,
    note: "Picked the best-value combo for you.",
  };

  const stubAi = (page: import("@playwright/test").Page, payload: unknown, status = 200) =>
    page.route("**/api/ai-design", (route) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(payload) }),
    );

  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("happy path: generate → preview → apply populates the builder (and emits ai.design_applied)", async ({
    page,
  }) => {
    await stubAi(page, { design });
    const consoleLines: string[] = [];
    page.on("console", (msg) => consoleLines.push(msg.text()));

    await page.goto("/builder");
    await page.getByLabel("Describe your workspace").fill("gaming setup");
    await page.getByRole("button", { name: "Generate" }).click();

    await expect(page.getByText("Monthly total", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Design with AI").getByText(desk.name)).toBeVisible();
    await expect(page.getByLabel("Design with AI").getByText(design.note)).toBeVisible();

    // D1 defaults seeded a chair + desk, so Apply asks for confirmation first.
    await page.getByRole("button", { name: "Apply this design" }).click();
    await page.getByRole("button", { name: "Replace setup" }).click();

    // Canvas rendering (main) — the desk/chair images also appear in panel cards.
    await expect(page.getByRole("main").getByAltText(desk.name).first()).toBeVisible();
    await expect(page.getByRole("main").getByAltText(chair.name).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View Setup Summary" })).toBeVisible();
    await expect
      .poll(() => consoleLines.some((l) => l.includes('"event":"ai.design_applied"')))
      .toBe(true);
  });

  test("applying over a non-empty cart requires confirmation", async ({ page }) => {
    await stubAi(page, { design });
    await page.goto("/builder");
    // D1 defaults already seeded a chair + desk → cart is non-empty.
    await page.getByLabel("Describe your workspace").fill("upgrade my setup");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText("Monthly total", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Apply this design" }).click();
    await expect(page.getByRole("button", { name: "Replace setup" })).toBeVisible();
    await page.getByRole("button", { name: "Replace setup" }).click();
    await expect(page.getByRole("main").getByAltText(desk.name).first()).toBeVisible();
  });

  test("an impossible budget shows an honest refusal", async ({ page }) => {
    await stubAi(page, {
      refusal: { message: "The cheapest rentable setup is Rp1.000.000 per month — no valid design fits." },
    });
    await page.goto("/builder");
    await page.getByLabel("Describe your workspace").fill("cheap setup");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText(/cheapest rentable setup/)).toBeVisible();
  });

  test("an off-topic query is rejected with the standardized message", async ({ page }) => {
    await stubAi(page, { rejection: { message: "query not about workspace building" } });
    await page.goto("/builder");
    await page.getByLabel("Describe your workspace").fill("what's the weather in Bali?");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText("query not about workspace building")).toBeVisible();
  });

  test("a disabled deployment surfaces an actionable message", async ({ page }) => {
    await stubAi(page, { error: "ai_disabled" }, 503);
    await page.goto("/builder");
    await page.getByLabel("Describe your workspace").fill("anything");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText(/isn't configured/)).toBeVisible();
  });

  test("cancel aborts a slow generation and returns to idle", async ({ page }) => {
    await page.route("**/api/ai-design", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.goto("/builder");
    await page.getByLabel("Describe your workspace").fill("slow request");
    await page.getByRole("button", { name: "Generate" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Generate" })).toBeVisible();
  });
});
