# Story e03s01: Domain services

**type:** feat
**risk:** P1
**context:** domain
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 4
**epic:** e03 (Shared Layers)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e03s01 |
| Title | Domain services |
| Epic | e03 |
| Type | feat |
| Risk | P1 |

## 2. Summary

The pure, React-free business logic layer (ADR 0002): `pricing.ts` (IDR formatting + monthly total), `setupRules.ts` (caps, exclusivity, partner exclusion), `validateSetupState.ts` (G1 hydration validation), plus the 80% branch coverage gate on `shared/domain` (D3).

## 3. Value

This is the heart of the product's correctness — the math the E2E suite independently cross-checks (#37). Pure functions are trivially unit-testable, and the coverage gate (D3) keeps them honest.

## 4. Domain Language

Monthly Total, caps, exclusivity, partner exclusion, hydration (GLOSSARY_LATEST).

## 5. Scenarios

- Total = sum of line items (flat monthly, #7)
- Caps enforced per category (#22); over-cap rejected
- Single chair/desk (exclusivity, #10)
- Partner items excluded from cart math (#20)
- Corrupt SetupState → defaults (G1)

## 6. Business Rules

Decisions #7, #10, #20, #22, G1, D3. All pure — zero React imports.

## 7. UI/UX

N/A (logic only). Drives PriceTag, StickySummaryBar, steppers, summary.

## 8. Data Model

`SetupState { chairId: string|null, deskId: string|null, quantities: Record<productId, number>, deliveryLocation?: string }`, `QuantityCaps` config table.

## 9. API Contracts

Internal contracts consumed by BuilderStore (e03s02) and features: `formatIdr()`, `monthlyTotal(setup, catalog)`, `canAdd(setup, product, caps)`, `validateSetupState(payload, catalog)`.

## 10. Validation Rules

G1: shape + business rules on hydration; any failure → D1 defaults. G2 rules reused by reducer (e03s02).

## 11. Security

Pure functions — no I/O, no secrets. Validation is the trust boundary (ADR 0004).

## 12. Performance

O(n) over line items; trivial.

## 13. Accessibility

N/A.

## 14. Observability

`validation.rejected` (warn) emitted by callers when an action is rejected (G2 path, wired in e03s02).

## 15. Error Handling

Throw-only (E1): domain functions never catch; callers (reducer/route) handle outcomes.

## 16. Edge Cases

- Empty cart total = 0
- Unknown product ID in setup → invalid → defaults
- Negative quantity → invalid → defaults
- Quantity at cap → further adds rejected

## 17. Acceptance Criteria

```gherkin
Scenario: Monthly total
  Given a setup with 2 monitors, 1 chair, 1 bean bag
  When monthlyTotal is computed
  Then the result equals the sum of the products' pricePerMonth

Scenario: Cap enforcement
  Given 3 monitors already in the setup
  When canAdd is asked for a 4th monitor
  Then it is rejected

Scenario: Partner exclusion
  Given the catalog contains the partner motorcycle
  When a partner item is added to the cart
  Then the action is rejected

Scenario: Corrupt hydration
  Given a payload with an unknown chairId and quantity 99
  When validateSetupState runs
  Then the result is the D1 default setup
```

## 18. Test Plan

`pricing.test.ts`, `setupRules.test.ts`, `validateSetupState.test.ts` — the 80% branch gate target (D3).

## 19. Dependencies

e02 (catalog types). Consumed by e03s02 and all features.

## 20. Definition of Done

All three modules + tests green; `pnpm test -- --coverage` shows ≥80% branch on shared/domain.
