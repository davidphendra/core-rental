import { expect, test } from "@playwright/test";

test.describe("page shell", () => {
  test("the footer shows the current app version from the git tag", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Core Rental · \d+\.\d+\.\d+/)).toBeVisible();
  });
});

test.describe("page shell negative flows (N2, N9)", () => {
  test("N2: an unknown URL shows the playful 404 with funnel CTAs", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("This page has surfed away")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Start Building" })).toHaveAttribute(
      "href",
      "/builder",
    );
  });

  test("N9: all routes carry the security headers (decision #13)", async ({ request }) => {
    for (const path of ["/", "/builder", "/store", "/summary", "/api/products"]) {
      const res = await request.get(path);
      const headers = res.headers();
      expect(headers["content-security-policy"], `CSP on ${path}`).toBeTruthy();
      expect(headers["x-frame-options"], `XFO on ${path}`).toBe("DENY");
      expect(headers["x-content-type-options"], `nosniff on ${path}`).toBe("nosniff");
    }
  });

  test("clickable elements show the pointer cursor on hover (UX ruling)", async ({ page }) => {
    // Builder: an enabled button + the search input.
    await page.goto("/builder");
    await expect(page.getByRole("button", { name: "Add Monitor" }).first()).toHaveCSS(
      "cursor",
      "pointer",
    );
    await expect(page.getByRole("searchbox", { name: "Search chairs" })).toHaveCSS(
      "cursor",
      "text",
    );
    // Home: a nav link.
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Builder" }).first()).toHaveCSS(
      "cursor",
      "pointer",
    );
  });
});
