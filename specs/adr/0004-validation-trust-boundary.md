# ADR 0004 — Validation trust boundary

- **Status:** Accepted (decisions G1–G4, E1–E3)
- **Context:** The principle "do not trust data from the user" was made explicit. The app's trust surfaces: rendered text (React-escaped by default), the read-only route handler (no input surface), and — the real risks — localStorage hydration (user-controllable payloads) and reducer actions.
- **Decision:** `validateSetupState` (pure, in `shared/domain`) validates shape + business rules on every localStorage read; any failure → reset to D1 defaults. The `BuilderStore` reducer validates every action via `setupRules` and rejects invalid ones as quiet no-ops. `localStorage` writes are try/catch-guarded (QuotaExceeded → warn + in-memory degrade). Delivery Location: trim + non-empty + max 120 chars, inline error, Rent disabled until valid. E2E N10/N11 prove recovery and validation in a real browser.
- **Consequences:** The app cannot render a corrupt cart or reach invalid state through UI bypass. Pure validation functions are unit-tested under the 80% shared/domain gate. Slightly more code than trusting storage; correctness over convenience.
