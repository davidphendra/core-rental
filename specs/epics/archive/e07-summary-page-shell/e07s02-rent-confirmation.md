# Story e07s02: Rent flow & mock confirmation

**type:** feat
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e07 (Summary Feature & Page Shell)

## 1. Metadata

| Field | Value                         |
| ----- | ----------------------------- |
| ID    | e07s02                        |
| Title | Rent flow & mock confirmation |
| Epic  | e07                           |
| Type  | feat                          |
| Risk  | P1                            |

## 2. Summary

The funnel's end (decisions #5, C2, C4): Rent button → mock confirmation screen with demo-honest copy (no Stripe/payment language), echoing the delivery location, and showing the exact line items + total from the cart.

## 3. Value

Closes the product story ("design → rent → confirmed") honestly — the demo proves the full funnel without pretending to transact (C2).

## 4. Domain Language

Rent, confirmation, delivery (GLOSSARY_LATEST).

## 5. Scenarios

- Rent (valid delivery) → confirmation screen
- Confirmation shows items + Qty + total matching the cart (displayed-value verification target)
- Confirmation echoes delivery location (C4)
- Copy: "your request has been received — we'll be in touch"; no Stripe/checkout/cancel-anytime (C2)

## 6. Business Rules

Decisions #5 (mock confirmation), C2 (demo-honest copy), C4 (delivery echo), #7 (total = sum).

## 7. UI/UX

Confirmation per tropical-tech; celebratory but honest tone.

## 8. Data Model

Reads SetupState (incl. deliveryLocation); no new persistence (mock flow).

## 9. API Contracts

None (client-side transition; no route change needed or a /summary confirmation state).

## 10. Validation Rules

Rent gated on valid delivery (G3); cannot Rent with empty cart (EmptyState path).

## 11. Security

PII: address echoed — rendered escaped only; not logged (O3).

## 12. Performance

Instant (client state).

## 13. Accessibility

Confirmation content announced; focus moves to confirmation heading.

## 14. Observability

rent.clicked (info) + delivery.submitted (info, hasAddress/addressLength only).

## 15. Error Handling

N/A (no async); invalid input already gated at e07s01.

## 16. Edge Cases

- Rent with empty cart → impossible (EmptyState, #23)
- Refresh after confirmation → cart persists (localStorage), confirmation state resets (acceptable for demo)

## 17. Acceptance Criteria

```gherkin
Scenario: Full funnel
  Given a valid setup and delivery location
  When the user clicks Rent
  Then a confirmation screen appears
  And it shows the same line items, quantities, and total as the summary
  And it echoes the delivery location
  And it contains no payment or Stripe language
```

## 18. Test Plan

`ConfirmationScreen.test.tsx` (content, total match, no payment copy); E2E summary.spec.ts positive.

## 19. Dependencies

e07s01 (summary), e03 (state).

## 20. Definition of Done

Rent → confirmation works end-to-end; displayed items/total match cart; no payment language; events logged.
