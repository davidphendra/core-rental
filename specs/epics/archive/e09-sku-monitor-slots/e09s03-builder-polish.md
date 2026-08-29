# Story e09s03: Builder direct-selection polish

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e09 (SKU System & Monitor Slots)

## 1. Metadata

| Field | Value                           |
| ----- | ------------------------------- |
| ID    | e09s03                          |
| Title | Builder direct-selection polish |
| Epic  | e09                             |
| Type  | feat                            |
| Risk  | P1                              |

## 2. Summary

Two small directness improvements to the builder canvas: the empty monitor slot button swaps its generic `add` icon for a `monitor` icon, and the empty chair/desk hints become clickable buttons (with `chair`/`desk` icons) that select the first chair / first desk from the catalog — the same one-click shortcut the accessory slots already offer.

## 3. Value

Removes the "go to the panel" detour for the two most common first actions (chair, desk) and makes the monitor slot self-describing. Lower friction = closer to the three-minute north star.

## 4. Domain Language

Canvas slot, hint, Select, Setup (GLOSSARY_LATEST).

## 5. Scenarios

- Empty monitor slot shows the `monitor` icon (not `add`)
- Empty chair state is a button: `chair` icon + "Add a chair from the panel" → selects the first chair
- Empty desk state is a button: `desk` icon + "Add a desk from the panel" → selects the first desk
- E2E matchers updated for the div→button change (role/name changes)

## 6. Requirements (delta)

#### MODIFIED: Add Monitor icon

**Before:** the empty monitor slot button displayed the generic Material Symbols `add` icon.
**After:** displays the `monitor` icon (the canonical monitor glyph; same outline style as `light`/`local_florist`).

#### MODIFIED: Empty chair hint is a one-click shortcut

**Before:** static text hint "Add a chair from the panel" inside a `role="img"` box labelled "No chair selected" — not interactive.
**After:** a button with the `chair` icon and label "Add a chair from the panel"; clicking selects the first chair in the catalog (mirrors the accessory slots' auto-add).

#### MODIFIED: Empty desk hint is a one-click shortcut

**Before:** static text hint "Add a desk from the panel" rendered on the desk-table graphic — not interactive.
**After:** a button with the `desk` icon and label "Add a desk from the panel"; clicking selects the first desk in the catalog.

## 7. UI/UX

Chair/desk hints keep the `slot-empty` dashed aesthetic, gain an icon above the label. The desk hint stays positioned on the desk table.

## 8. Data Model

No state changes — reuses `selectChair`/`selectDesk` with the first catalog product of each category (same lookup as D1 defaults).

## 9. API Contracts

`useBuilderStore.selectChair/selectDesk` (existing). No new actions.

## 10. Validation Rules

None new — first-chair/first-desk lookups reuse the default-selection logic.

## 11. Security

No new surface (buttons dispatch existing, validated actions).

## 12. Performance

No change.

## 13. Accessibility

Hints become real buttons (keyboard-focusable, Enter/Space triggers). Clear aria-labels preserved.

## 14. Observability

No new events.

## 15. Error Handling

Empty catalog → `defaultSelection` returns nulls → hints render as before (no crash).

## 16. Edge Cases

- Catalog empty → hints remain but clicking is a no-op (no first chair/desk exists)
- Both chair and desk unselected → both hints clickable simultaneously

## 17. Acceptance Criteria

```gherkin
Scenario: Monitor icon
  Given an empty monitor slot
  When the canvas renders
  Then the slot button shows the monitor icon

Scenario: Chair hint selects first chair
  Given no chair selected
  When the user clicks "Add a chair from the panel"
  Then the first chair in the catalog is selected and rendered

Scenario: Desk hint selects first desk
  Given no desk selected
  When the user clicks "Add a desk from the panel"
  Then the first desk in the catalog is selected and rendered
```

## 18. Test Plan

`BuilderCanvas.test.tsx` (icon, hint buttons dispatch first chair/desk), `builder-wiring.test.tsx` (default-selection reuse). E2E `builder.spec.ts` (click hint from canvas → first chair/desk selected).

## 19. Dependencies

e09s01 (E2E fixture churn), e09s02 (same canvas components).

## 20. Definition of Done

Monitor slot shows the `monitor` icon; chair/desk hints are clickable buttons with icons that select the first chair/desk; E2E matchers updated; unit + E2E green.
