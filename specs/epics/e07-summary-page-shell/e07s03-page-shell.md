# Story e07s03: Page shell

**type:** feat
**risk:** P1
**context:** infra
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e07 (Summary Feature & Page Shell)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e07s03 |
| Title | Page shell |
| Epic | e07 |
| Type | feat |
| Risk | P1 |

## 2. Summary

The App Router page-shell trio (decisions #26–29): `not-found.tsx` (playful 404 + funnel CTAs, N2), `error.tsx` + `global-error.tsx` (generic copy + Try again/reset + Back to Home, structured error.boundary log, raw errors never rendered), `loading.tsx` (brand skeleton for route chunks).

## 3. Value

Every failure mode gets a friendly branded surface (the original gap-hunt finding); the E2E N2/N9 flows depend on these files.

## 4. Domain Language

404, error boundary, skeleton (GLOSSARY_LATEST).

## 5. Scenarios

- Unknown URL → playful 404 with Back to Home + Start Building (N2)
- Render error in a route → branded error page with Try again (reset) + Back to Home
- Root-layout failure → global-error page (own html/body)
- Chunk load → loading skeleton (#29)

## 6. Business Rules

Decisions #26 (trio), #27 (playful 404), #28 (generic copy + reset + home + structured log), #29 (loading).

## 7. UI/UX

404: "this page has surfed away" + CTAs. Error: calm copy + recovery. Both tropical-tech.

## 8. Data Model

None.

## 9. API Contracts

None (file conventions).

## 10. Validation Rules

N/A.

## 11. Security

Raw error text never rendered (client components show the original Error message — must not display it, #28); error.boundary log carries name/message to console only.

## 12. Performance

Code-split boundaries; zero-cost when unused.

## 13. Accessibility

404/error pages keyboard-navigable; Try again is a real button.

## 14. Observability

error.boundary (error) on boundary catch (E4 upgrade: structured).

## 15. Error Handling

This story IS the error-handling surface (render-level). Event/async errors handled at their sites (E1).

## 16. Edge Cases

- global-error must define its own <html>/<body> (it replaces the layout)
- Error during chunk load → error boundary catches, not a blank screen

## 17. Acceptance Criteria

```gherkin
Scenario: Playful 404
  Given an unknown URL
  When the page loads
  Then the playful 404 with Back to Home and Start Building CTAs is shown

Scenario: Error boundary
  Given a route throws during render
  When the error boundary catches it
  Then a branded error page with Try again and Back to Home is shown
  And the raw error text is not displayed
  And an error.boundary event is logged

Scenario: Loading skeleton
  Given a route chunk is loading
  When the route renders
  Then the brand loading skeleton is shown
```

## 18. Test Plan

Unit: not-found/error/loading render tests; E2E N2 (404) + N9 (headers on these routes) in e08.

## 19. Dependencies

e01 (shell), e03 (logger).

## 20. Definition of Done

Trio renders per #26–29; raw errors never shown; error.boundary logged structured; E2E N2/N9 green.
