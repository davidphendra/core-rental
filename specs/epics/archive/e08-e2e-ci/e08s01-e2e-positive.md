# Story e08s01: E2E positive suite

**type:** feat
**risk:** P0
**context:** infra
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 4
**epic:** e08 (E2E Suite & CI)

## 1. Metadata

| Field | Value              |
| ----- | ------------------ |
| ID    | e08s01             |
| Title | E2E positive suite |
| Epic  | e08                |
| Type  | feat               |
| Risk  | P0                 |

## 2. Summary

Playwright setup (ADR 0005) + positive specs: `playwright.config.ts` (webServer = production build, chromium), fixtures (reset-state, catalog-helpers with spec-local arithmetic per #37), and builder/store/summary happy-path specs asserting **displayed text** (items + IDR totals).

## 3. Value

Proves the product story end-to-end in a real browser against the exact production artifact — the acceptance floor for "done" (decision #35).

## 4. Domain Language

E2E, spec-local arithmetic, displayed-value verification (GLOSSARY_LATEST).

## 5. Scenarios

- builder: select chair/desk, stack 2 monitors, sticky IDR total updates (assert rendered text)
- store: add surfboard → cart
- summary: line items + total match spec-computed sum → Rent → confirmation shows same items + total

## 6. Business Rules

Decisions #34–38: production build target, displayed-text assertions, catalog-import expectations, root `e2e/` location.

## 7. UI/UX

N/A (tests).

## 8. Data Model

Catalog helpers import `products.json` (committed, deterministic) and compute expected totals with plain arithmetic — never app logic (#37).

## 9. API Contracts

Specs hit `http://localhost:3000` (webServer).

## 10. Validation Rules

Expected values computed independently of app pricing/setupRules (bug in pricing must fail E2E).

## 11. Security

N/A beyond N9 (headers, in e08s02).

## 12. Performance

Chromium-only; production build; `workers` tuned for CI.

## 13. Accessibility

N/A (a11y covered by unit tests, #24).

## 14. Observability

Test artifacts: traces/video on failure (Playwright).

## 15. Error Handling

Auto-waiting + trace on failure; retries for flake.

## 16. Edge Cases

- Fresh localStorage per spec (reset fixture) — no cross-test cart leakage
- Slow first load — auto-wait on selectors

## 17. Acceptance Criteria

```gherkin
Scenario: Builder happy path
  Given the production app is running
  When the user builds a setup (chair, desk, 2 monitors)
  Then the sticky bar shows the spec-computed IDR total

Scenario: Store to summary
  Given the surfboard was added in the store
  When the summary loads
  Then the line items and Monthly Total match the independently computed expectation

Scenario: Rent confirmation
  Given a valid delivery location
  When the user clicks Rent
  Then the confirmation shows the same items, quantities, and total
```

## 18. Test Plan

This story IS E2E: builder.spec.ts, store.spec.ts, summary.spec.ts (positive). Runs via `pnpm test:e2e`.

## 19. Dependencies

e05/e06/e07 (features under test), e01 (build).

## 20. Definition of Done

Positive specs pass against `next build && next start`; fixtures enforce clean state + independent arithmetic.
