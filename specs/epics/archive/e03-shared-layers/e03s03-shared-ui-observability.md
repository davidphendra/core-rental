# Story e03s03: Shared UI primitives & observability

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e03 (Shared Layers)

## 1. Metadata

| Field | Value                                |
| ----- | ------------------------------------ |
| ID    | e03s03                               |
| Title | Shared UI primitives & observability |
| Epic  | e03                                  |
| Type  | feat                                 |
| Risk  | P1                                   |

## 2. Summary

The DRY layer every feature shares (ADR 0002): `shared/ui` primitives (ProductCard, PriceTag, Button, LoadingSkeleton, ErrorState — D4) and `shared/observability/logger.ts` (structured JSON, curated taxonomy O2, PII-free by construction O3), plus mounting Analytics/SpeedInsights and wiring the logger into error boundaries.

## 3. Value

Prevents the three feature pages from hand-rolling cards, price formatting, spinners, and error banners (guaranteed drift). The logger makes observability (O1–O4) real and queryable.

## 4. Domain Language

PriceTag, ErrorState, structured log, taxonomy (GLOSSARY_LATEST).

## 5. Scenarios

- ProductCard renders product data + image with fallback (N7 path)
- PriceTag formats IDR consistently app-wide (single home, #3)
- ErrorState shows friendly copy + retry (query.refetch)
- LoadingSkeleton matches root loading aesthetic
- logger emits JSON lines; API has no address field

## 6. Business Rules

Decisions #3 (IDR single home), #24 (Button a11y baseline), D4 (shared query states), O1–O4 (observability), #31 (image fallback).

## 7. UI/UX

Primitives follow tropical-tech tokens; ErrorState copy friendly, never raw errors (#28).

## 8. Data Model

Logger events per O2 taxonomy; no Product model changes.

## 9. API Contracts

`logger.info/warn/error/debug(event, fields)` — event names restricted to taxonomy; `formatIdr()` reused by PriceTag.

## 10. Validation Rules

Logger structurally rejects PII (no address parameter — O3). Event names validated (typo → type error).

## 11. Security

PII-free logging (O3); ErrorState never renders raw error text (#28).

## 12. Performance

Logger is synchronous console JSON; negligible.

## 13. Accessibility

Button: focus-visible rings, aria props. ProductCard: alt text, semantic buttons. LoadingSkeleton: aria-hidden.

## 14. Observability

This story IS the observability layer: logger + Analytics + SpeedInsights + error-boundary wiring (O1–O4).

## 15. Error Handling

ErrorState retry → `query.refetch()`; error.boundary events logged structured (replaces raw console.error, #28/E4 upgrade).

## 16. Edge Cases

- Image load failure → fallback SVG (N7)
- Logger in production → minimal output cost; levels respected
- Event name typo → type-checked (union type)

## 17. Acceptance Criteria

```gherkin
Scenario: PriceTag formats IDR
  Given a price of 750000
  When PriceTag renders
  Then it displays the id-ID formatted Rupiah amount

Scenario: ErrorState retry
  Given a failed query
  When the user clicks Retry
  Then query.refetch is called

Scenario: Logger is PII-free
  Given the logger API
  When any event is logged
  Then no address or personal data field is accepted or emitted

Scenario: Image fallback
  Given a product image fails to load
  When ProductCard renders
  Then the local SVG placeholder is shown
```

## 18. Test Plan

`ProductCard.test.tsx`, `PriceTag.test.tsx`, `ErrorState.test.tsx`, `logger.test.ts` (format, levels, PII-absence). Unit layer.

## 19. Dependencies

e02 (types), e03s01 (pricing for PriceTag). Consumed by e04–e07.

## 20. Definition of Done

All primitives + logger + tests green; Analytics/SpeedInsights mounted; error boundaries log structured events.
