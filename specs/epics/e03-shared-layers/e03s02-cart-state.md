# Story e03s02: Cart state & persistence

**type:** feat
**risk:** P0
**context:** domain
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 4
**epic:** e03 (Shared Layers)

## 1. Metadata

| Field | Value |
|---|---|
| ID | e03s02 |
| Title | Cart state & persistence |
| Epic | e03 |
| Type | feat |
| Risk | P0 |

## 2. Summary

The cross-feature cart (ADR 0002): `BuilderStore` (context + reducer validating every action via setupRules — G2), `useLocalStorage` (quota-guarded writes E3, validate-and-fallback reads G1), `useBuilderStore` hook, and `SetupState` type.

## 3. Value

The cart is the product's spine — builder, store, and summary all read/write it. Validating at the reducer (G2) makes the state machine self-protecting, and guarded persistence (E3) means storage limits can never break it.

## 4. Domain Language

Cart, SetupState, hydration, quota guard (GLOSSARY_LATEST).

## 5. Scenarios

- Add accessory → quantity increments (up to cap)
- Select second chair → replaces first (exclusivity)
- Add partner item → rejected (no-op)
- Corrupt localStorage → app renders D1 defaults
- Storage full → warn + in-memory degrade, cart keeps working

## 6. Business Rules

Decisions #10, #11, #22, G1, G2, E3, D1 (defaults). Reducer is the single mutation path.

## 7. UI/UX

N/A (state layer). Persistence means the setup survives refresh/navigation (#11).

## 8. Data Model

`SetupState` (e03s01), storage key `core-rental:setup:v1` (versioned for future schema changes, G1 rationale).

## 9. API Contracts

Reducer actions: `selectChair` / `selectDesk` / `addAccessory` / `removeAccessory` / `setQuantity` / `setDeliveryLocation` / `reset`. Hook: `useBuilderStore()`.

## 10. Validation Rules

G2: every action validated; invalid → unchanged state. G1: hydration validates shape + rules → defaults on failure.

## 11. Security

Trust boundary enforcement at the state layer (ADR 0004). No PII in persisted key.

## 12. Performance

Reducer is O(1)–O(n) over quantities; localStorage writes debounced? (single write per commit — fine).

## 13. Accessibility

N/A (state layer); reducer supports keyboard-driven actions from e05.

## 14. Observability

`cart.updated` (debug) on commits; `storage.degraded` (warn) on quota fallback; `validation.rejected` (warn) on no-op rejections (O2).

## 15. Error Handling

E3: `setItem` throws → warn + in-memory mode. Reads: parse/validation failure → defaults (never crash).

## 16. Edge Cases

- QuotaExceeded in private mode → in-memory degrade
- Old-schema payload → version key mismatch → defaults
- Rapid stepper clicks → reducer serializes state transitions

## 17. Acceptance Criteria

```gherkin
Scenario: Add respects caps
  Given a setup with 3 monitors
  When addAccessory is dispatched for a 4th monitor
  Then the state is unchanged

Scenario: Chair exclusivity
  Given chair A is selected
  When selectChair dispatches chair B
  Then the state contains only chair B

Scenario: Corrupt storage recovery
  Given localStorage contains invalid JSON-shaped data
  When the store hydrates
  Then the setup is the D1 default (first chair + first desk)

Scenario: Storage quota failure
  Given setItem throws QuotaExceededError
  When the cart commits
  Then the app warns (storage.degraded) and continues in memory
```

## 18. Test Plan

`BuilderStore.test.tsx` (reducer: actions, rejections, defaults), `useLocalStorage.test.ts` (read/validate/write/guard), integration with setupRules + pricing (totals). 80% gate applies via domain dependency coverage.

## 19. Dependencies

e03s01 (domain services), e02 (catalog). Consumed by e05–e07.

## 20. Definition of Done

Reducer rejects invalid actions; hydration falls back to D1 defaults; quota failure degrades gracefully; all tests green.
