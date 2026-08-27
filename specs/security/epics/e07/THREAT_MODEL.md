# Threat Model — e07 (Summary Feature & Page Shell)

> build-epic Step 0 · scope-based threat modeling from the e07 epic capsule.
> e07 handles the app's only PII (delivery location) and the error-boundary surfaces.

## Surface area (e07 scope)

| Surface        | Files                                                                   | Notes                                                              |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Summary view   | `features/summary/components/SummaryView.tsx`                           | Line items + Monthly Total (C1), zone tiles (C3), empty state (N1) |
| Delivery input | `features/summary/components/DeliveryInput.tsx`                         | Free-text PII (G3 validation)                                      |
| Rent flow      | `features/summary/components/ConfirmationScreen.tsx`                    | Mock confirmation (C2), echoes delivery (C4)                       |
| Page shell     | `src/app/not-found.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx` | Error surfaces (#26–29)                                            |

## Findings

### T1 — Delivery location PII handling — LOW — CWE-922/CWE-532 (adjacent)

- **Description:** The delivery address is the app's only PII: it is typed, validated, persisted client-side, and echoed into the confirmation.
- **Exploit scenario:** (a) XSS reads it from localStorage; (b) a logging bug ships it to Vercel logs; (c) invalid input passes validation.
- **Mitigation (planned):** G3 validation (trim + non-empty + ≤120, shared rule in `validateDeliveryLocation`) with inline error + Rent gated (N11 path, e07s01) · React-escaped rendering everywhere (never `dangerouslySetInnerHTML`, #13) · **never logged** (logger is PII-free by construction, O3/M2 — `delivery.submitted` logs only `hasAddress`/`addressLength`) · XSS mitigated by CSP + no-sink rule. **L1 PII-at-rest accepted** (decision C4, client-side demo persistence).
- **Task mapping:** e07s01-2 (`security: low`), e07s02-2 (`security: low`).

### T2 — Error boundary detail leakage — LOW — CWE-209 (adjacent)

- **Description:** error.tsx/global-error.tsx receive the raw Error; a careless render leaks stack traces to users.
- **Exploit scenario:** An error message containing user input or internals renders in the error page.
- **Mitigation (planned):** #28 — generic copy + Try again (reset) + Back to Home only; raw error text never rendered; structured `error.boundary` log carries name/message to the console sink only. global-error.tsx owns its html/body per docs.
- **Task mapping:** e07s03-2.

### T3 — 404 / loading surfaces — NONE

- Not-found and loading pages carry no user data and no inputs. Noted for completeness.

### T4 — Empty-state surface — NONE

- The N1 empty state has no input surface. Noted.

## Risk summary

| ID  | Finding                                     | Severity | CWE         |
| --- | ------------------------------------------- | -------- | ----------- |
| T1  | Delivery PII (validated, escaped, unlogged) | LOW      | CWE-922/532 |
| T2  | Error boundary detail leakage               | LOW      | CWE-209     |
| T3  | 404 / loading                               | NONE     | —           |
| T4  | Empty state                                 | NONE     | —           |

**Epic-level risk: LOW** — no HIGH/CRITICAL; no WSJF boost. T1/T2 are design-mitigated (G3 + PII-free logger + #28 generic copy) and test-verified.

## Verification & gates

- E2E N1 (empty state), N2 (404), N9 (headers incl. error routes), N11 (delivery validation) at e08
- Unit tests: DeliveryInput validation, ConfirmationScreen copy (no Stripe), page-shell renders
- Security diff-scan at verify-work Phase 5
