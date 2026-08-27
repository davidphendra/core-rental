# Threat Model — e03 (Shared Layers)

> build-epic Step 0 · scope-based threat modeling from the e03 epic capsule.
> e03 holds two of the app's most security-sensitive surfaces: the **hydration
> trust boundary** (validateSetupState) and the **PII-free logger** (O3).

## Surface area (e03 scope)

| Surface              | Files                                       | Notes                                                                     |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Hydration validation | `shared/domain/validateSetupState.ts`       | Trust boundary for untrusted localStorage payloads (G1)                   |
| State mutation       | `shared/state/BuilderStore.tsx`             | Reducer validating every action via setupRules (G2)                       |
| Persistence          | `shared/state/useLocalStorage.ts`           | Reads (validated) + writes (quota-guarded, E3)                            |
| Domain rules         | `shared/domain/pricing.ts`, `setupRules.ts` | Pure math + rules (flat monthly, caps, partner exclusion)                 |
| Logging              | `shared/observability/logger.ts`            | Structured JSON; PII-free by construction (O3)                            |
| UI primitives        | `shared/ui/*`                               | ProductCard, PriceTag, Button, LoadingSkeleton, ErrorState (display-only) |
| Analytics mounting   | layout (Analytics, SpeedInsights)           | Vercel beacons (allowlisted, e01)                                         |

## Findings

### M1 — Hydration trust-boundary correctness — MEDIUM — CWE-20 (Improper Input Validation)

- **Description:** `validateSetupState` is the single gate between untrusted localStorage and the rendered app. A validation hole (accepted over-cap quantity, unknown product ID, non-integer quantity, second chair) lets corrupt state reach the UI and breaks E2E N10's guarantee.
- **Exploit scenario:** A tampered `core-rental:setup:v1` payload with `quantities: {"nope": 99}` passes validation → app renders 99 items or crashes the canvas.
- **Mitigation (planned):** Strict shape + business-rule validation (quantities 0..cap, IDs ∈ catalog, single chair/desk, no partner items); **any failure → D1 defaults** (G1). Enforced by `validateSetupState.test.ts` (boundary cases: empty/max/off-by-one/unknown/negative) + E2E N10 (corrupt storage → defaults, no crash). This is the epic's P0 test target.
- **Task mapping:** e03s01-3 (P0), e03s02-2 (P0).

### M2 — Sensitive data in logs — MEDIUM — CWE-532 (Insertion of Sensitive Information into Log File)

- **Description:** Structured logs ship to Vercel infrastructure (queryable). The delivery address (e07) is the app's only PII; it must be impossible to log, not merely discouraged.
- **Exploit scenario:** A future `logger.info("delivery", { address })` writes PII into permanent queryable logs.
- **Mitigation (planned):** The `logger` API is **PII-free by construction** (O3) — no field/parameter for an address exists; `delivery.submitted` logs `hasAddress`/`addressLength` only. Enforced by `logger.test.ts` PII-absence test (asserts the API surface rejects/omits address-like fields). CONVENTIONS.md hard rule.
- **Task mapping:** e03s03-3 (P0, `security: medium`).

### L1 — PII at rest in localStorage — LOW — CWE-922 (Insecure Storage of Sensitive Information, adjacent)

- **Description:** The delivery location persists client-side (decision C4).
- **Exploit scenario:** A device compromise or XSS reads localStorage.
- **Mitigation (planned):** Accepted by decision C4 (client-side demo persistence). XSS is mitigated by construction (#13: no `dangerouslySetInnerHTML`, React escaping) + CSP (e01). No backend to exfiltrate to. Accepted.
- **Task mapping:** e03s02-2.

### L2 — Reducer no-op rejections — LOW (observability, not security)

- **Description:** G2 rejections return unchanged state silently; a UI bypass could produce confusing behavior.
- **Mitigation (planned):** `validation.rejected` (warn) logged on every rejection (O2) — visible in Vercel logs for diagnosis.
- **Task mapping:** e03s02-1, e03s03-3.

### L3 — PriceTag/formatIdr — NONE

- Display-only; no user input; no security surface. Noted for completeness.

## Risk summary

| ID  | Finding                          | Severity | CWE     |
| --- | -------------------------------- | -------- | ------- |
| M1  | Hydration validation correctness | MEDIUM   | CWE-20  |
| M2  | Sensitive data in logs           | MEDIUM   | CWE-532 |
| L1  | PII at rest (localStorage)       | LOW      | CWE-922 |
| L2  | Reducer no-op rejections         | LOW      | —       |
| L3  | formatIdr                        | NONE     | —       |

**Epic-level risk: LOW-MEDIUM** — two MEDIUMs, both **design-mitigated + test-enforced** (validate-and-fallback; PII-free logger API). No HIGH/CRITICAL → no WSJF boost.

## Verification & gates

- `validateSetupState.test.ts` boundary coverage (M1) — part of the D3 80% branch gate on shared/domain
- `logger.test.ts` PII-absence (M2)
- E2E N10 (corrupt storage → defaults) at e08
- Security diff-scan rerun at verify-work Phase 5
