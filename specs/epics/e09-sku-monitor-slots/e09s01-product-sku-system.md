# Story e09s01: Product SKU system

**type:** refactor
**risk:** P0
**context:** domain
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 8
**epic:** e09 (SKU System & Monitor Slots)

## 1. Metadata

| Field | Value              |
| ----- | ------------------ |
| ID    | e09s01             |
| Title | Product SKU system |
| Epic  | e09                |
| Type  | refactor           |
| Risk  | P0                 |

## 2. Summary

Replace the human-readable product `id` with a 12-character alphanumeric **skuNo** — a 3-letter category/subtype code plus a 9-character deterministic hash of the product name. The SKU becomes the system identifier used by the cart (chairId/deskId/quantities keys), the validation trust boundary, and E2E expectations. The generator and curated hero overlay emit SKUs deterministically (byte-stable regenerations); image assets decouple from the SKU so URLs stay stable.

## 3. Value

Gives every product a stable, opaque, validatable system identity; removes the latent cap-key quirk (hero `accessory-monstera` had no subtype); strengthens the catalog contract (format + uniqueness checks); keeps the demo robust against future renames.

## 4. Domain Language

SKU, catalog, cap key, Setup, Monthly Total (GLOSSARY_LATEST).

## 5. Scenarios

- products.json contains only `skuNo` (12 alnum, unique, known-code prefix) — no `id`
- capKeyForProduct derives caps from the SKU prefix (MON/LMP/PLT/CFE/BBG)
- Cart keys (chairId/deskId/quantities) use skuNo; old localStorage carts reset to D1 defaults
- Regenerating the catalog is byte-stable

## 6. Requirements (delta)

#### RENAMED: Product identifier

**Before:** `Product.id` — human slug ids (`chair-uluwatu-chair`, `accessory-monitor-abc`) embedding category/cap-key/subtype; used as cart keys, cap-key input, and placeholder filenames.
**After:** `Product.skuNo` — exactly 12 chars `[A-Z]{3}[A-Z0-9]{9}`; 3-letter code (CHA/DSK/MON/LMP/PLT/CFE/BBG/EXT/PTN) + 9-char deterministic hash of the product name; the system identifier for cart keys, validation, and E2E.

#### MODIFIED: Cap-key derivation

**Before:** `capKeyForProduct` derived the cap key from `id.split("-")[1]` (e.g. `accessory-monitor-…` → `monitor`); hero `accessory-monstera` had no subtype → `null` cap (latent quirk).
**After:** `capKeyForProduct` derives the cap key from the 3-letter SKU code prefix (MON→monitor, LMP→lamp, PLT→plant, CFE→coffee, BBG→beanbag); `QUANTITY_CAPS` unchanged; every accessory has a valid code — the monstera quirk is gone.

#### MODIFIED: Image asset derivation

**Before:** non-hero images were `/placeholders/${id}.svg` with files named by the id.
**After:** placeholder filenames derive from the product name slug — stable URLs independent of the sku.

#### MODIFIED: Catalog contract validation

**Before:** `isProduct` checked `id` was a non-empty string.
**After:** validates the 12-char format, a known code prefix, and catalog-wide uniqueness.

#### MODIFIED: Persisted-cart compatibility

**Before:** localStorage carts keyed by old-format ids.
**After:** `STORAGE_KEY` bumped; old carts hydrate to D1 defaults (fresh chair + desk, empty slots) — never crash, never invalid state.

## 7. UI/UX

No visual change to any page (skus are internal). The builder/store/summary render identically.

## 8. Data Model

`Product { skuNo, name, category, pricePerMonth, description, image, badge? }`. SetupState keys (chairId/deskId/quantities) become skuNos. products.json regenerated in place.

## 9. API Contracts

`/api/products` response shape unchanged (products.json served as-is — the field rename is internal to the schema consumers read). `getCatalog`/`useProducts` signatures unchanged.

## 10. Validation Rules

`isProduct`/`isValidCatalog`: 12-char alnum + known code + uniqueness. `validateSetupState`: skuNo-based id checks (unchanged semantics, new keys).

## 11. Security

Trust boundary (ADR 0004) preserved: old-format ids in localStorage fail validation → D1 fallback. No new attack surface.

## 12. Performance

No change — same catalog payload size (sku ~ same length as slugs).

## 13. Accessibility

No change.

## 14. Observability

No new events. Existing catalog.loaded/failed taxonomy unchanged.

## 15. Error Handling

Invalid committed catalog still falls back (getCatalog → []) and the API route 500s (E2 path unchanged).

## 16. Edge Cases

- Hash collision in generated SKUs → generator guarantees uniqueness (deterministic, collision-resolved)
- Old localStorage cart with old ids → validation rejects → D1 defaults (no crash)
- Hero products with curated image URLs keep their URLs (only non-hero placeholders derive from slug)

## 17. Acceptance Criteria

```gherkin
Scenario: Catalog uses skus
  Given the committed products.json
  When validated
  Then every product has a skuNo matching [A-Z]{3}[A-Z0-9]{9} and no id field
  And all skuNos are unique

Scenario: Caps hold under the sku scheme
  Given the catalog
  When capKeyForProduct reads any accessory skuNo
  Then the derived cap key matches the product's subtype and QUANTITY_CAPS applies

Scenario: Old carts reset cleanly
  Given localStorage holds a pre-change cart (old-format ids)
  When the app hydrates
  Then the state falls back to D1 defaults without crashing

Scenario: Regeneration is stable
  Given the generator
  When run twice
  Then products.json is byte-identical
```

## 18. Test Plan

`catalog.test.ts` (sku format/uniqueness), `setupRules.test.ts` (cap from prefix), `validateSetupState.test.ts` (sku keys + old-cart rejection), `BuilderStore.test.tsx` (keys), `products-route.test.ts` (API shape). E2E fixtures + specs updated (`e2e/fixtures/catalog-helpers.ts`, builder/store/summary specs).

## 19. Dependencies

None (foundation). Feeds e09s02 (monitorSlots store skuNos) and e09s03 (fixture churn).

## 20. Definition of Done

products.json has only skuNo (12 alnum, unique, known codes); caps derived from prefix; old carts reset cleanly; images slug-based; all unit + E2E green.
