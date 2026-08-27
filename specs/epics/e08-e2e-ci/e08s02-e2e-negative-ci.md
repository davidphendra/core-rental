# Story e08s02: E2E negative suite & CI completion

**type:** feat
**risk:** P0
**context:** infra
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 5
**epic:** e08 (E2E Suite & CI)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e08s02 |
| Title | E2E negative suite & CI completion |
| Epic | e08 |
| Type | feat |
| Risk | P0 |

## 2. Summary

The 11 negative flows (N1–N11, decisions #35/G4) + the complete CI workflow: lint → typecheck → unit + coverage gate → build → Playwright → belt-and-braces marker grep on `.next/static` (proves no test code ships). Plus README Deploy section.

## 3. Value

The trust-boundary proofs (N10 corrupt storage, N11 input validation) and security checks (N9 headers) make the demo's guarantees verifiable in a real browser — and CI gates every merge on all of it (D5).

## 4. Domain Language

Negative flow, trust boundary (GLOSSARY_LATEST).

## 5. Scenarios

- N1 empty cart → empty state; N2 404; N3 cap; N4 removal; N5 exclusivity; N6 partner exclusion; N7 image fallback; N8 API failure; N9 security headers; N10 corrupt storage recovery; N11 delivery validation
- CI runs the full gate on every PR; main stays green

## 6. Business Rules

Decisions #35 (N1–N9), G4 (N10/N11), #36 (CI order), D5 (PR gate), D3 (coverage gate), E2 (contract guard path in N8).

## 7. UI/UX

N/A (tests + workflow).

## 8. Data Model

N10 seeds corrupt localStorage via `addInitScript`; N11 drives the delivery input.

## 9. API Contracts

N8 aborts `/api/products` via route interception; N9 asserts response headers.

## 10. Validation Rules

N10: corrupt payload → D1 defaults; N11: empty/121-char → error + Rent disabled.

## 11. Security

N9 asserts the CSP/header posture; belt-and-braces grep proves test code absent from `.next/static`.

## 12. Performance

CI e2e job on production build; artifacts (traces) uploaded on failure.

## 13. Accessibility

N/A.

## 14. Observability

CI artifacts = trace/video on failure.

## 15. Error Handling

N8 asserts the friendly in-page ErrorState (not a crash) when the API fails.

## 16. Edge Cases

- Flake mitigation: retries + auto-wait; deterministic seeds
- CI without network → Playwright browser install cached

## 17. Acceptance Criteria

```gherkin
Scenario: N10 corrupt storage
  Given localStorage is seeded with an invalid setup payload
  When /builder loads
  Then the app renders the D1 default workspace without crashing

Scenario: N11 delivery validation
  Given an empty delivery location
  When the user submits
  Then an inline error shows and Rent is disabled
  When a valid address is entered
  Then Rent is enabled

Scenario: N9 security headers
  Given the production app
  When any route is requested
  Then CSP + security headers are present

Scenario: CI gate
  Given a PR is opened
  When CI runs
  Then lint, typecheck, unit+coverage, build, and E2E all pass
  And no test-only marker is found in .next/static
```

## 18. Test Plan

page-shell.spec.ts (N2, N9), resilience.spec.ts (N7, N8, N10), summary.spec.ts (N1, N11), builder.spec.ts (N3–N5), store.spec.ts (N6).

## 19. Dependencies

e08s01 (suite infra), all features.

## 20. Definition of Done

All 11 negative specs green; CI workflow complete with coverage gate + marker grep; README Deploy section written.
