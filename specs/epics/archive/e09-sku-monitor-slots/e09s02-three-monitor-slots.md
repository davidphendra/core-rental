# Story e09s02: Three monitor slots

**type:** feat
**risk:** P0
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 8
**epic:** e09 (SKU System & Monitor Slots)

## 1. Metadata

| Field | Value               |
| ----- | ------------------- |
| ID    | e09s02              |
| Title | Three monitor slots |
| Epic  | e09                 |
| Type  | feat                |
| Risk  | P0                  |

## 2. Summary

Replace the single quantity-based monitor slot with **three discrete monitor slots** on the builder canvas (`monitorSlots: [skuNo|null, skuNo|null, skuNo|null]`). Each slot holds exactly one monitor; any model combination is allowed (1A+1B+1C, 2A+1B, 3C) up to a total of 3. The panel's monitor products switch from quantity steppers to Select buttons: fills the first empty slot, replaces the most-recently-added card when full (with a brief highlight), and is a no-op when the monitor is already placed.

## 3. Value

Direct, slot-based monitor placement — the most common setup need (multi-monitor workstations) becomes a natural 1-2-3 click flow with visible per-slot state.

## 4. Domain Language

Monitor slot, Select, cap key, Setup, Monthly Total (GLOSSARY_LATEST).

## 5. Scenarios

- Three empty monitor slots render as compact "Add Monitor" buttons in a row above the desk
- Clicking an empty slot adds the first catalog monitor
- Selecting a monitor in the panel fills the first empty slot
- All three full → selecting another monitor replaces the most-recently-added card (brief highlight)
- Selecting a monitor already placed → no-op
- × clears a slot (each slot individually)
- Summary line items reflect the monitor slots (grouped by skuNo, duplicates allowed)

## 6. Requirements (delta)

#### ADDED: Three discrete monitor slots

The builder holds up to 3 monitors, one per discrete slot. Empty slots render as compact "Add Monitor" buttons; clicking one adds the first catalog monitor. Each slot can be cleared individually with ×. Fresh carts start with all three slots empty. The total monitor cap stays 3.

#### ADDED: Monitor Select semantics

Selecting a monitor in the panel fills the first empty slot; when all three are full, selecting again replaces the **most-recently-added** card, shown with a brief visual highlight on the swapped card; selecting a monitor already placed is a **no-op** (no duplicate juggling).

#### REMOVED: Monitor quantity steppers

**Before:** monitors tracked in `quantities` (count per product id, cap 3); the canvas had one monitor slot with a `×{quantity}` badge and arrow-key stepper; the panel used `QuantityStepper` per monitor product.
**After:** (removed) — replaced by the discrete slot model above. Lamp/plant/coffee/beanbag keep their steppers unchanged.

#### MODIFIED: Monitor line items in the Summary

**Before:** line items derived from `quantities` per monitor product.
**After:** derived from `monitorSlots`, grouped by skuNo (duplicates allowed, e.g. 2× the same monitor shows quantity 2).

## 7. UI/UX

A centered row of 3 compact slots (≈160×112px) above the desk, matching the compact product-tile feel. Empty state: dashed + monitor icon + "Add Monitor". Filled: product image + top-left ×. Replace: brief highlight animation on the swapped card.

## 8. Data Model

`SetupState.monitorSlots: [string | null, string | null, string | null]` (skuNos). `quantities` no longer accepts monitor keys. New reducer actions: `selectMonitor(product)` and `removeMonitorSlot(index)`.

## 9. API Contracts

`useBuilderStore` gains the two actions; `useCartTotals` derives monitor line items from slots. No HTTP changes.

## 10. Validation Rules

`monitorSlots` validated: exactly 3 entries, each `null` or a catalog monitor skuNo. `quantities` entries must be non-monitor accessories. `selectMonitor`: no-op when already placed; replace-most-recent when full. Total monitor count never exceeds 3.

## 11. Security

Trust boundary (ADR 0004) extended to `monitorSlots` — corrupt slot arrays reject on hydration. No new attack surface.

## 12. Performance

Three slot components instead of one — negligible. Replaces are cheap reducer commits.

## 13. Accessibility

Each slot is a button with a clear aria-label ("Add Monitor", "Remove Monitor"); the panel Select buttons use `aria-pressed`; the replace highlight is non-essential decoration (aria-live not needed — state change is visible in the card content).

## 14. Observability

`cart.updated` (debug) on slot mutations, consistent with other cart actions.

## 15. Error Handling

Corrupt monitorSlots in localStorage → validation rejects → D1 defaults. Invalid slot index in `removeMonitorSlot` → quiet no-op.

## 16. Edge Cases

- All 3 slots full with [A,B,C]; select A (already placed) → no-op (Q3 ruling)
- Select C three times on empty slots → (3C)
- Slots [A,B,C], full; select D → C (most recent) replaced → [A,B,D]
- removeMonitorSlot on an empty slot → no-op

## 17. Acceptance Criteria

```gherkin
Scenario: First empty slot fills
  Given at least one empty monitor slot
  When a monitor is selected in the panel
  Then the first empty slot shows that monitor

Scenario: Full slots replace most recent
  Given three monitor slots are full
  When a different monitor is selected in the panel
  Then the most-recently-added card shows the new monitor with a brief highlight

Scenario: Already placed is a no-op
  Given a monitor is already in a slot
  When it is selected again in the panel
  Then no slot changes

Scenario: Any combination builds
  Given three empty monitor slots
  When monitors are selected
  Then combinations like (2A, 1B) or (3C) are reachable

Scenario: Slot clears
  Given a filled monitor slot
  When its × is clicked
  Then the slot returns to its empty state
```

## 18. Test Plan

`BuilderStore.test.tsx` (selectMonitor/removeMonitorSlot semantics), `validateSetupState.test.ts` (monitorSlots shape), `summary-page.test.tsx` (line items), `BuilderCanvas.test.tsx` (3 slots, replace highlight), `SelectionPanel.test.tsx` (Select buttons). E2E `builder.spec.ts` + `summary.spec.ts` (combos, replace, no-op, ×).

## 19. Dependencies

e09s01 (slots store skuNos). Feeds e09s03 (canvas polish rides the same components).

## 20. Definition of Done

3 slots render and behave per the rulings (fill-first-empty / replace-most-recent + highlight / no-op-if-placed / ×-clear); combos buildable; line items correct; unit + E2E green.
