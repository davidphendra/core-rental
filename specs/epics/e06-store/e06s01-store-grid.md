# Story e06s01: Store grid & category filter

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e06 (Store Feature)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e06s01 |
| Title | Store grid & category filter |
| Epic | e06 |
| Type | feat |
| Risk | P1 |

## 2. Summary

Port `docs/design/bali_essentials_store/code.html`: product grid via shared ProductCard, working category filter tabs (Chairs/Desks/Accessories/Extras — #33), breadcrumbs, Add-to-Setup actions that respect caps, and image fallback (N7).

## 3. Value

The second catalog surface — where accessories and extras get added to the setup outside the builder. The filter tabs make ~55 items browsable without pagination (#33).

## 4. Domain Language

Store grid, category filter, Add to Setup (GLOSSARY_LATEST).

## 5. Scenarios

- Grid renders catalog products (filtered by active tab)
- Filter tabs switch categories client-side
- Add to Setup → cart (cap-aware)
- Surfboard = standard line item (#20)
- Broken image → SVG fallback (N7)

## 6. Business Rules

Decisions #33 (filter tabs), #19 (unified catalog), #22 (caps), #20 (surfboard in cart), #31 (images).

## 7. UI/UX

Per bali_essentials_store mockup: grid cards, sidebar tabs (desktop) / horizontal pills (mobile), breadcrumbs (Builder › Extras › Summary).

## 8. Data Model

Consumes Product[] (e02) + SetupState (e03s02).

## 9. API Contracts

addAccessory (or add line item for extras) via useBuilderStore.

## 10. Validation Rules

Cap-aware add: exceeding cap rejected by reducer (G2) and reflected in UI.

## 11. Security

No new surface.

## 12. Performance

Client-side filtering (cache from TanStack Query); no per-tab fetch.

## 13. Accessibility

Tabs = buttons with aria-selected; cards keyboard-reachable; alt text.

## 14. Observability

cart.updated (debug) on adds.

## 15. Error Handling

Catalog failure → ErrorState; image failure → fallback.

## 16. Edge Cases

- Add at cap → button disabled/hint (N3 applies across surfaces)
- Partner item (motorcycle) → NOT an Add-to-Setup card (renders Request Rental, e06s02)

## 17. Acceptance Criteria

```gherkin
Scenario: Filter tabs
  Given the Accessories tab is active
  When the grid renders
  Then only accessory-category products are shown

Scenario: Add to setup
  Given a plant is not at its cap
  When the user clicks Add to Setup on a plant
  Then the plant is added to the cart

Scenario: Cap respected
  Given plants are at cap
  When the grid renders
  Then the Add control for plants is disabled

Scenario: Image fallback
  Given a product image request fails
  When the card renders
  Then the SVG placeholder is displayed
```

## 18. Test Plan

`StoreGrid.test.tsx`, `StoreCard.test.tsx`; E2E store.spec.ts positive + N6/N7 (e08).

## 19. Dependencies

e02, e03. Feeds e06s02 (partner).

## 20. Definition of Done

Grid + filter + add-to-setup work; caps respected; image fallback tested.
