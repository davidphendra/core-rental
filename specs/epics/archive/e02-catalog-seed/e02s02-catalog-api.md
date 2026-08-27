# Story e02s02: Catalog API & query layer

**type:** feat
**risk:** P1
**context:** domain
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e02 (Catalog & Seed Generation)

## 1. Metadata

| Field | Value                     |
| ----- | ------------------------- |
| ID    | e02s02                    |
| Title | Catalog API & query layer |
| Epic  | e02                       |
| Type  | feat                      |
| Risk  | P1                        |

## 2. Summary

Serve the catalog over HTTP (decision #25): `src/app/api/products/route.ts` (static import + contract guard → generic 500, E2), typed access module `shared/data/products.ts` (sole reader), TanStack Query hook `useProducts`, and `shared/types/product.ts`.

## 3. Value

The route handler justifies TanStack Query (server-state caching), isolates the JSON→API swap for the future, and the typed layer is the contract every feature consumes.

## 4. Domain Language

Route handler, query, catalog (GLOSSARY_LATEST).

## 5. Scenarios

- GET /api/products returns the catalog as typed JSON
- A malformed/empty payload returns 500 {"error":"Products unavailable"} (contract guard)
- Features fetch via useProducts with loading/error states

## 6. Business Rules

Decisions #25 (route handler + client fetch), E2 (static import + guard), #4 (no backend — read-only).

## 7. UI/UX

No UI (loading/error states land in e03s03 shared primitives).

## 8. Data Model

`shared/types/product.ts`: `Product`, `Category` (incl. 'partner'), `ProductCatalog` = Product[].

## 9. API Contracts

`GET /api/products` → 200 `Product[]` | 500 `{"error":"Products unavailable"}`.

## 10. Validation Rules

Contract guard on response payload (non-empty array, well-typed). Client hydration of the _cart_ is separate (G1, e03s02).

## 11. Security

Read-only; no params/body (no input surface); generic 500 message (no internals, #13).

## 12. Performance

Static import = zero runtime I/O; TanStack Query caches across navigation.

## 13. Accessibility

N/A (data layer).

## 14. Observability

`catalog.loaded` (info, with durationMs) / `catalog.failed` (error) — taxonomy O2, wired in e03s03.

## 15. Error Handling

Fetch failure → query error state (D4 ErrorState in e03s03); E2E N8 asserts it.

## 16. Edge Cases

- Empty array after generator bug → 500 (contract guard) — never 200 with bad data
- Concurrent first loads → single query key dedupes

## 17. Acceptance Criteria

```gherkin
Scenario: Catalog served
  Given the production app is running
  When a client requests GET /api/products
  Then the response is 200 with the full product array

Scenario: Contract guard
  Given the catalog payload is empty or malformed
  When a client requests GET /api/products
  Then the response is 500 with {"error": "Products unavailable"}

Scenario: Query hook
  Given a feature calls useProducts
  When the query resolves
  Then the feature receives the typed catalog
```

## 18. Test Plan

`products-route.test.ts` (200 shape, 500 guard), `useProducts.test.ts` (success/error states). Vitest + Testing Library.

## 19. Dependencies

e02s01 (products.json). Consumed by e03+, e05–e07.

## 20. Definition of Done

Route handler + guard + types + hook + tests green; `pnpm typecheck` passes.
