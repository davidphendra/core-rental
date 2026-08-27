# Story e05s03: Builder wiring

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e05 (Builder Feature)

## 1. Metadata

| Field | Value          |
| ----- | -------------- |
| ID    | e05s03         |
| Title | Builder wiring |
| Epic  | e05            |
| Type  | feat           |
| Risk  | P1             |

## 2. Summary

Integrate the builder page end-to-end: wire `BuilderStore` + `useProducts` into the page, pre-selected defaults (D1), loading/error states (D4), and persistence integration (cart survives navigation/refresh; corrupt storage falls back to defaults — G1/N10).

## 3. Value

Turns the canvas + panel into a working product: state flows, data loads, and the localStorage trust boundary is proven in the real UI.

## 4. Domain Language

Wiring, hydration, defaults (GLOSSARY_LATEST).

## 5. Scenarios

- Page loads with defaults (D1)
- Catalog fetch shows LoadingSkeleton then products (or ErrorState on failure — N8 path)
- Cart commits persist to localStorage; refresh restores
- Corrupt localStorage → defaults, no crash (N10 path)

## 6. Business Rules

Decisions D1 (defaults), G1 (hydration), D4 (query states), #11 (persistence).

## 7. UI/UX

Skeleton matches root loading aesthetic; no visual gap between query resolution and panel render.

## 8. Data Model

SetupState + Product[] (existing contracts).

## 9. API Contracts

useProducts + useBuilderStore at page level; page is a client component (#25).

## 10. Validation Rules

Hydration validation runs on every load (G1).

## 11. Security

Trust boundary honored: never render unvalidated storage content.

## 12. Performance

One catalog fetch; query cache reused across features.

## 13. Accessibility

Loading states don't trap focus; ErrorState retry is keyboard-reachable.

## 14. Observability

cart.updated (debug), catalog.loaded (info, durationMs).

## 15. Error Handling

Query failure → ErrorState with retry; hydration failure → defaults.

## 16. Edge Cases

- First paint before hydration → avoid hydration mismatch (client-only read after mount)
- Navigation away/back → cart intact (context in layout)

## 17. Acceptance Criteria

```gherkin
Scenario: Defaults on first load
  Given no stored setup
  When /builder loads
  Then the first chair and first desk are in the cart and the total reflects them

Scenario: Corrupt storage recovery
  Given localStorage holds an invalid setup payload
  When /builder loads
  Then the app renders the D1 default workspace (no crash)

Scenario: Refresh persistence
  Given a setup with 2 monitors
  When the page is refreshed
  Then the setup is restored from localStorage
```

## 18. Test Plan

`Builder.wiring.test.tsx`, `Builder.persistence.test.tsx`; E2E N10 (corrupt storage) in e08.

## 19. Dependencies

e05s01, e05s02, e03 (state), e02 (data).

## 20. Definition of Done

Builder page wired end-to-end: defaults, loading/error, persistence, corrupt-storage recovery; tests green.
