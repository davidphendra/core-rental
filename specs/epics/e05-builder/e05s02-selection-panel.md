# Story e05s02: Selection panel & quantity steppers

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 4
**epic:** e05 (Builder Feature)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e05s02 |
| Title | Selection panel & quantity steppers |
| Epic | e05 |
| Type | feat |
| Risk | P1 |

## 2. Summary

The builder's control surface: selection panel tabs (Chairs / Desks / Accessories / Extras) filtering the unified catalog, product cards, single-select chair/desk (exclusivity, #10), accessory QuantityStepper with caps (#22), and the sticky Monthly Total bar + mobile bottom nav per the mockup.

## 3. Value

This is where the user composes their setup — the interaction layer of the builder. Caps and exclusivity here mirror the reducer's enforcement (G2), giving belt-and-braces UX + state protection.

## 4. Domain Language

Selection panel, stepper, Monthly Total (GLOSSARY_LATEST).

## 5. Scenarios

- Tabs filter the catalog (Chairs → 10, Desks → 10, Accessories; Extras → zone items: coffee machine + bean bag cards)
- Clicking a chair card selects it (replaces previous — exclusivity)
- Stepper increments accessory quantity; disabled at cap (N3)
- Sticky bar shows live Monthly Total in IDR
- Mobile bottom nav (Build/Store/Summary/Rent)

## 6. Business Rules

Decisions #10 (single-select chair/desk), #22 (caps), #7 (flat monthly total), #33 (tabs filter), D1 (defaults).

## 7. UI/UX

Per interactive_builder mockup: sidebar panel (desktop) + pill tabs (mobile), card grid, sticky rounded total bar with "Ready to Rent?" CTA.

## 8. Data Model

Consumes Product[] (e02) + SetupState (e03s02).

## 9. API Contracts

Actions: selectChair/selectDesk/addAccessory/setQuantity via useBuilderStore; totals via pricing.monthlyTotal.

## 10. Validation Rules

UI reflects reducer rules: caps disable steppers, exclusivity swaps selection.

## 11. Security

No new surface.

## 12. Performance

Client-side filter (O(catalog)); no refetch per tab (TanStack Query cache).

## 13. Accessibility

Tabs = real buttons with aria-selected; steppers keyboard-operable (arrows); cards selectable via keyboard; focus-visible everywhere.

## 14. Observability

cart.updated (debug); validation.rejected (warn) if an action is refused.

## 15. Error Handling

Catalog failure → ErrorState in panel; card image failure → fallback.

## 16. Edge Cases

- Extras tab maps to the zone items (coffee machine + bean bag); adding them fills the canvas zones (Coffee Station / Relax Zone) per the mockup's "Secondary Zones (Extras)" framing
- Surfboard is deliberately store-only (decision #20) — never appears in the builder panel; zero-item tabs are impossible
- Stepper at cap → disabled with cap hint text

## 17. Acceptance Criteria

```gherkin
Scenario: Chair exclusivity in UI
  Given chair A is selected
  When the user selects chair B
  Then only chair B appears selected

Scenario: Cap disables stepper
  Given 3 monitors in the cart
  When the monitor stepper is rendered
  Then the increment control is disabled

Scenario: Live total
  Given a setup with 2 monitors, 1 chair, 1 bean bag
  When the sticky bar renders
  Then it shows the sum of those items' monthly prices in IDR

Scenario: Tab filter
  Given the Desks tab is active
  When the panel renders
  Then only desk products are shown

Scenario: Extras tab = zone items
  Given the Extras tab is active
  When the panel renders
  Then coffee machine and bean bag cards are shown
  And the surfboard is not present (store-only per decision #20)
```

## 18. Test Plan

`QuantityStepper.test.tsx`, `StickySummaryBar.test.tsx` + panel tests. E2E: builder.spec.ts positive, N3/N4/N5.

## 19. Dependencies

e05s01 (canvas), e02, e03. Feeds e05s03 wiring.

## 20. Definition of Done

Tabs filter correctly; exclusivity + caps enforced in UI; sticky total live and correct; unit + E2E green.
