# Story e02s01: Catalog generator & hero overlay

**type:** feat
**risk:** P1
**context:** domain
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 4
**epic:** e02 (Catalog & Seed Generation)

## 1. Metadata

| Field | Value                            |
| ----- | -------------------------------- |
| ID    | e02s01                           |
| Title | Catalog generator & hero overlay |
| Epic  | e02                              |
| Type  | feat                             |
| Risk  | P1                               |

## 2. Summary

Build the deterministic catalog pipeline (decisions #19, #30, #31, #32): `scripts/curated-hero.ts` (7 mockup-exact products) + `scripts/generate-catalog.ts` (produces ~55–60 unified products with round IDR prices, categories + partner, SVG placeholder paths) + generated SVG placeholder tiles + integrity tests.

## 3. Value

The unified `products.json` is the single source of truth for every feature, E2E expectation (#37), and domain test. Regenerating after a price tweak is one command.

## 4. Domain Language

Catalog, hero products, placeholder tiles, category, partner (GLOSSARY_LATEST).

## 5. Scenarios

- Running the generator produces a committed `products.json` with 10 chairs, 10 desks, 8 monitors, 6 lamps, 8 plants, 5 coffee, 5 bean bags, 4 surfboards, 1 partner
- Every product has id, name, category, pricePerMonth (IDR), image, description
- Hero products carry their Google image URLs; others carry SVG placeholder paths
- Integrity tests pass (types, categories, counts, caps)

## 6. Business Rules

Decisions #19 (unified catalog), #30 (tiered counts), #31 (hybrid images), #32 (generator + overlay), #21 (round IDR market rates), #6/#20 (categories incl. partner).

## 7. UI/UX

SVG placeholders: category-colored tile, Material icon, name + IDR price — on-brand with tropical-tech.

## 8. Data Model

`Product { id, name, category: 'chair'|'desk'|'accessory'|'extra'|'partner', pricePerMonth: number, description, image, badge? }` (shared/types/product.ts in e02s02).

## 9. API Contracts

Consumed by `/api/products` (e02s02) and E2E specs (#37).

## 10. Validation Rules

Generator-enforced: every product typed; categories valid; counts per #30; caps consistent with setupRules (#22).

## 11. Security

No secrets; images from owned placeholders or allowlisted Google host.

## 12. Performance

~60 products ≈ KBs of JSON; static import bundles it.

## 13. Accessibility

Placeholder tiles include alt text (product name).

## 14. Observability

N/A (data pipeline).

## 15. Error Handling

Generator fails fast with clear message on invalid template data.

## 16. Edge Cases

- Curated hero overlay must win over generated entries for the same ID
- Regeneration must be deterministic (stable output for identical input)

## 17. Acceptance Criteria

```gherkin
Scenario: Catalog volume
  Given the generator has run
  Then products.json contains exactly 10 chairs, 10 desks, 8 monitors, 6 lamps, 8 plants, 5 coffee machines, 5 bean bags, 4 surfboards, and 1 partner motorcycle

Scenario: Every product is complete
  Given products.json is loaded
  Then every product has non-empty id, name, category, pricePerMonth, image, and description
  And every category value is one of chair, desk, accessory, extra, partner

Scenario: Hero overlay wins
  Given the hero overlay defines Uluwatu Chair
  When the generator runs
  Then products.json contains the hero's name, price, and Google image URL for that ID
```

## 18. Test Plan

`catalog.test.ts` (integrity: volume, completeness, categories, hero precedence, determinism). Unit layer, Vitest.

## 19. Dependencies

None (standalone scripts + public assets). Consumed by e02s02, e03+, e08.

## 20. Definition of Done

Generator + overlay + placeholders committed; `pnpm generate:catalog` runs; `pnpm test -- catalog.test.ts` green; products.json satisfies counts/completeness.
