# Story e06s02: Partner request modal

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e06 (Store Feature)

## 1. Metadata

| Field | Value                 |
| ----- | --------------------- |
| ID    | e06s02                |
| Title | Partner request modal |
| Epic  | e06                   |
| Type  | feat                  |
| Risk  | P1                    |

## 2. Summary

The motorcycle partner flow (decisions #20, C2): the `category: 'partner'` product renders a tertiary "Request Rental" button (not Add to Setup), opening a client-side modal with details + demo-honest mock confirmation. The partner item is structurally excluded from cart/summary — enforced by category in setupRules (N6 path).

## 3. Value

Honors the mockup's distinct "Request Rental / Partner Service" semantics while keeping the cart math honest (workspace equipment only, no scooter in the total). No new route (modal, per decision #20 refinement).

## 4. Domain Language

Partner request, modal (GLOSSARY_LATEST).

## 5. Scenarios

- Motorcycle card shows "Request Rental" + Partner Service badge
- Click → modal with motorcycle details + Request action
- Request → demo-honest confirmation in the modal ("we'll be in touch", no payment — C2)
- Motorcycle never appears in cart, sticky total, or summary (N6)

## 6. Business Rules

Decisions #20 (partner semantics), C2 (demo-honest copy), G2 (partner adds rejected by reducer).

## 7. UI/UX

Per bali_essentials_store mockup: tertiary filled button + verified badge; modal styled with tropical-tech tokens; focus-trapped dialog (a11y).

## 8. Data Model

Consumes the partner Product from the unified catalog; no cart mutation.

## 9. API Contracts

No new routes; modal is feature-local state. `requestPartner()` logs the event.

## 10. Validation Rules

Reducer rejects partner items (G2) — double insurance with UI.

## 11. Security

No new surface; modal content from catalog (no user input).

## 12. Performance

Modal = client-side state; no extra fetch.

## 13. Accessibility

Modal: role=dialog, aria-modal, focus trap, Esc to close, focus returns to trigger.

## 14. Observability

partner.requested (info) — taxonomy O2.

## 15. Error Handling

N/A beyond global (no async in modal).

## 16. Edge Cases

- Esc/backdrop click closes modal without requesting
- Double-request → idempotent (event logged once per open-confirm)

## 17. Acceptance Criteria

```gherkin
Scenario: Request button
  Given the motorcycle product
  When the store renders
  Then it shows "Request Rental" and never "Add to Setup"

Scenario: Modal confirmation
  Given the user clicks Request Rental
  When they confirm the request
  Then a demo-honest confirmation appears in the modal

Scenario: Cart exclusion
  Given a partner request was made
  When the summary renders
  Then the motorcycle is absent from line items and the total
```

## 18. Test Plan

`PartnerRequestModal.test.tsx` (open, confirm, esc, exclusion); E2E N6 (store.spec.ts).

## 19. Dependencies

e06s01 (grid), e03 (state rules).

## 20. Definition of Done

Modal flow works; partner excluded from cart/summary; a11y dialog behavior tested; N6 E2E green.
