# Story e04s01: Home page

**type:** feat
**risk:** P2
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e04 (Home Feature)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e04s01 |
| Title | Home page |
| Epic | e04 |
| Type | feat |
| Risk | P2 |

## 2. Summary

Port `docs/design/moni_s_workspace_home/code.html` per rulings C5/C6: hero ("Your Bali Office, Delivered." + Tropical Tech badge + Build/View Accessories CTAs + floating product cards from the catalog), How-it-Works (3 steps with rewritten step-2 copy), anchor nav, and per-page metadata/OG (D2).

## 3. Value

The marketing landing is the funnel's front door for the nomad audience; the catalog-driven floating cards prove live data on the first screen.

## 4. Domain Language

Hero, How-it-Works, tagline (GLOSSARY_LATEST).

## 5. Scenarios

- Hero renders tagline, badge, CTAs
- Floating product cards render catalog products (name + IDR price)
- Step 2 copy: "month-to-month, no long-term commitment" (C6)
- No profile avatar (C5)
- Anchor nav: Home / Workspace Builder / Accessory Store

## 6. Business Rules

Decisions #18 (brand), C5 (no avatar), C6 (rewritten copy), D2 (metadata/OG), #7 (no duration selector — copy only).

## 7. UI/UX

Per moni_s_workspace_home mockup; tropical-tech tokens; floating cards use real catalog data (not mockup's placeholder names — #19).

## 8. Data Model

Consumes `Product[]` via useProducts for floating cards (or server-component direct read — home is a server component, #25).

## 9. API Contracts

useProducts (e02s02); metadata via Next Metadata API.

## 10. Validation Rules

N/A (no user input on home).

## 11. Security

N/A beyond global posture; no avatar (no auth affordance, C5).

## 12. Performance

Server component (no client JS for hero); floating card images optimized via next/image.

## 13. Accessibility

Semantic headings/links; CTA buttons keyboard-reachable; alt text on card images.

## 14. Observability

Page views via Analytics (O1); no custom events needed.

## 15. Error Handling

Card image failure → fallback (shared, #31); catalog fetch failure → ErrorState (D4).

## 16. Edge Cases

- Catalog empty (pre-e02) → cards section shows ErrorState, page still renders
- Mobile: floating cards stack per mockup breakpoints

## 17. Acceptance Criteria

```gherkin
Scenario: Hero renders
  Given the home page loads
  Then the tagline "Your Bali Office, Delivered." is visible
  And a Build Your Setup CTA navigates to /builder

Scenario: Step-2 copy
  Given the How-it-Works section
  Then step 2 reads "month-to-month, no long-term commitment"
  And no duration selector is present

Scenario: No avatar
  Given the home header
  Then no user profile avatar is rendered

Scenario: Catalog-driven cards
  Given the catalog has products
  Then the floating cards show real product names and IDR prices
```

## 18. Test Plan

Component tests (Hero, HowItWorks) + E2E home smoke via page-shell.spec.ts (N9 headers apply here too).

## 19. Dependencies

e01 (layout/shell), e02 (catalog), e03 (primitives). Lowest WSJF — can land last.

## 20. Definition of Done

Home renders per mockup with C5/C6 rulings; metadata/OG present; no avatar; step-2 copy honest.
