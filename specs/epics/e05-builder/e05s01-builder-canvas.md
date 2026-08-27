# Story e05s01: Builder canvas

**type:** feat
**risk:** P0
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 5
**epic:** e05 (Builder Feature)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e05s01 |
| Title | Builder canvas |
| Epic | e05 |
| Type | feat |
| Risk | P0 |

## 2. Summary

The visual heart of the product (ADR 0005's primary flow): port `docs/design/interactive_builder/code.html`'s canvas — desk + chair visuals, empty/solid slots (monitor, lamp, plant), secondary zones (Coffee Station, Relax Zone), slot click-to-add, and keyboard operability (#24). Pre-selected defaults (D1) render from the cart.

## 3. Value

This is the "cool, visual, fun" experience the product brief demands — the demo's wow shot. It also carries the P0 interaction risk: slot state, cap-driven fills, and keyboard access all live here.

## 4. Domain Language

Canvas, slot, zone, Monthly Total (GLOSSARY_LATEST).

## 5. Scenarios

- Canvas renders desk + chair from the cart (defaults when empty — D1)
- Empty slots show dashed state + add affordance
- Selected items fill slots with their images
- Secondary zones fill when coffee machine / bean bag in cart
- Keyboard: tab to slots, Enter/Space adds, arrows adjust quantity

## 6. Business Rules

Decisions #10 (quantities), #22 (caps), D1 (defaults), #24 (a11y), #20 (surfboard is NOT a canvas zone — store extra only).

## 7. UI/UX

Per interactive_builder mockup: bento canvas, slot-empty dashed style, drop shadows, dot-grid background. Light mode.

## 8. Data Model

Consumes SetupState (e03s02) + Product[] (e02).

## 9. API Contracts

Cart actions via useBuilderStore (selectChair/selectDesk/addAccessory/setQuantity). Slot registry maps slots → categories (monitor→monitors, lamp→lamps, plant→plants).

## 10. Validation Rules

Caps enforced at action dispatch (G2, reducer); stepper/canvas UI disables at cap (N3 path).

## 11. Security

No new surface; partner items structurally excluded from canvas slots.

## 12. Performance

Client component (interactive); slot updates are cheap reducer commits; images via next/image.

## 13. Accessibility

Keyboard-operable canvas (tab/Enter/Space/arrows), focus-visible rings, aria-labels on slots, aria-pressed on selected states.

## 14. Observability

cart.updated (debug) on slot changes (O2).

## 15. Error Handling

Catalog fetch failure → ErrorState (D4); slot image failure → fallback (#31).

## 16. Edge Cases

- Empty cart → D1 defaults render (pre-selected first chair + desk)
- Cap reached on a slot → slot shows filled cap state, add disabled
- Surfboard selected in store → appears as extra, NOT a canvas zone

## 17. Acceptance Criteria

```gherkin
Scenario: Defaults render
  Given an empty cart
  When the builder loads
  Then the first chair and first desk are selected and visible on the canvas

Scenario: Slot fills
  Given a monitor is added
  When the canvas renders
  Then the monitor slot shows the monitor image instead of the dashed empty state

Scenario: Keyboard add
  Given focus is on an empty slot
  When the user presses Enter
  Then an item is added to the cart (subject to caps)

Scenario: Cap on canvas
  Given 3 monitors are in the cart
  When the monitor slot is interacted with
  Then no further add is possible
```

## 18. Test Plan

`BuilderCanvas.test.tsx` (renders defaults, slot fill, cap), `BuilderCanvas.a11y.test.tsx` (keyboard). E2E positive builder.spec.ts + N3/N4/N5 (e08).

## 19. Dependencies

e02 (catalog), e03 (state/primitives). Feeds e05s02/e05s03.

## 20. Definition of Done

Canvas renders defaults + slot fill + zones; keyboard operable; cap enforced; unit tests green.
