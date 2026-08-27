# ADR 0005 — Playwright full-regression E2E

- **Status:** Accepted (decisions #34–#38, G4)
- **Context:** The team required E2E distinct from integration tests, located at the repo root, covering full user-interface interaction (positive AND negative flows) with displayed-value verification. Playwright was the standard Next.js choice (already recorded as a future gate in the original #16).
- **Decision:** Playwright (`@playwright/test`), Chromium-only, `webServer` auto-starting a local **production build** (`next build && next start`). Suite at `e2e/` root: positive flows mimicking real interaction + 11 negative flows (N1–N11). Expectations import `products.json` and compute totals with spec-local arithmetic — never importing app domain logic (so a pricing bug fails E2E). CI runs E2E after unit/integration; gates merges.
- **Consequences:** The whole stack (domain math, cart, lazy-loaded chunks, page shell) is cross-validated in a real browser. Chromium-only keeps runs fast. Specs are slightly more brittle than unit tests — mitigated by the curated taxonomy and production-build target.
