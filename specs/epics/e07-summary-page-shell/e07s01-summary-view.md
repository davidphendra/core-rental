# Story e07s01: Summary view

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 4
**epic:** e07 (Summary Feature & Page Shell)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e07s01 |
| Title | Summary view |
| Epic | e07 |
| Type | feat |
| Risk | P1 |

## 2. Summary

Port `docs/design/review_rent/code.html` **with rulings C1/C3/C4 applied**: line items + Qty + Monthly Total only (no delivery fee/grand total — C1), two zone tiles (Coffee Station, Relax Zone) with cart-driven fill states (C3), the Delivery Location input with validation (G3), and the empty-cart state + CTA (#23).

## 3. Value

The conversion surface: users confirm their setup and delivery before Rent. The rulings keep it honest to decisions #7/#5 (flat monthly, mock flow).

## 4. Domain Language

Line item, Monthly Total, zone tile, delivery location (GLOSSARY_LATEST).

## 5. Scenarios

- Line items show product name + Qty + monthly price
- Monthly Total = sum (C1: no extra rows)
- Zone tiles fill when coffee machine / bean bag in cart; empty otherwise (C3)
- Delivery Location: trim, non-empty, ≤120 chars, inline error, Rent disabled until valid (G3)
- Empty cart → friendly empty state + "Start building" → /builder (#23)

## 6. Business Rules

Decisions #7 (flat monthly), C1 (no fees), C3 (two zone tiles), C4 (delivery input kept), G3 (validation), #23 (empty state).

## 7. UI/UX

Per review_rent mockup minus C1/C3 deltas: visual preview section kept, receipt card, delivery input, zone tiles grid.

## 8. Data Model

Consumes SetupState (e03s02) + Product[] (e02); deliveryLocation stored in SetupState.

## 9. API Contracts

setDeliveryLocation via useBuilderStore; totals via pricing.monthlyTotal.

## 10. Validation Rules

G3: trim → non-empty → ≤120 chars; aria-invalid + aria-describedby; Rent gated.

## 11. Security

Delivery address is PII — rendered escaped (React), never logged (O3), persisted client-side only.

## 12. Performance

Static computation from cart; no fetch beyond catalog.

## 13. Accessibility

Labeled input with error association; zone tiles have aria-labels; empty state CTA is a link.

## 14. Observability

delivery.submitted (info) — logs hasAddress/addressLength only (O3).

## 15. Error Handling

Empty cart → EmptyState (not an error page); invalid input → inline error (not a crash).

## 16. Edge Cases

- Direct navigation to /summary with empty cart → EmptyState (N1)
- 121-char address → error + Rent disabled (N11)
- Very long item list → receipt scrolls, layout intact

## 17. Acceptance Criteria

```gherkin
Scenario: Line items and total
  Given a setup with 2 monitors, 1 chair, 1 bean bag
  When the summary renders
  Then each item shows name, Qty, and monthly price
  And the Monthly Total equals the sum of those prices (no fee rows)

Scenario: Zone tiles
  Given a coffee machine in the cart but no bean bag
  When the zone overview renders
  Then Coffee Station is filled and Relax Zone shows empty state

Scenario: Delivery validation
  Given an empty delivery location
  When the user attempts to Rent
  Then an inline error appears and Rent remains disabled
  When a valid address (≤120 chars) is entered
  Then Rent becomes enabled

Scenario: Empty cart
  Given no setup exists
  When /summary is visited
  Then an empty state with a Start building CTA appears
```

## 18. Test Plan

`SummaryView.test.tsx`, `DeliveryInput.test.tsx`; E2E summary.spec.ts positive + N1/N11 (e08).

## 19. Dependencies

e03 (state/pricing/primitives), e05/e06 (cart content). Feeds e07s02 (rent).

## 20. Definition of Done

Line items + total + zone tiles per rulings; delivery validation enforced; empty state works; tests green.
