import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite (decisions #34–38): runs against a LOCAL production build
 * (next build && next start) — the exact artifact Vercel will deploy.
 * Chromium only; specs live at the repo root in e2e/ (distinct from
 * colocated Vitest). Expectations import products.json with spec-local
 * arithmetic (#37) — never app logic.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
