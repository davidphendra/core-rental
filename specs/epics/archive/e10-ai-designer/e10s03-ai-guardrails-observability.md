# Story e10s03: AI guardrails, observability & verification

**type:** hardening
**risk:** P1
**context:** platform
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 5
**epic:** e10 (AI Workspace Designer)

## 1. Metadata

| Field | Value                                       |
| ----- | ------------------------------------------- |
| ID    | e10s03                                      |
| Title | AI guardrails, observability & verification |
| Epic  | e10                                         |
| Type  | hardening                                   |
| Risk  | P1                                          |

## 2. Summary

Wrap the AI route in demo-lite guardrails (env gate, best-effort in-memory rate limit, hard output cap) and add PII-safe observability events. Verify the whole epic: full unit + E2E suites green, preflight and CI green, and a minor version bump on release. This story makes the AI feature safe to run on a public, unauthenticated demo.

## 3. Value

The route is public and unauthenticated; without guardrails a discovered endpoint could burn the OpenAI key's budget. Observability keeps the AI debuggable while honoring the project's PII guard. Verification keeps the "every change passes preflight + E2E + CI" bar intact.

## 4. Domain Language

Env gate, rate limit, output cap, PII guard, observability taxonomy.

## 5. Scenarios

- No `OPENAI_API_KEY`/`AI_MODEL` configured → `/api/ai-design` returns 503 "AI disabled"
- > ~10 requests / 10 min from one IP → 429
- LLM output exceeds the token/design cap → rejected
- ai.request / ai.design_applied events fire with no prompt text
- Unit + E2E suites + preflight + CI green; version bump v1.12.0

## 6. Requirements (delta)

#### ADDED: Env gate

Route returns `503 { error: "ai_disabled" }` unless a provider is configured (key present, or `AI_BASE_URL` set for LM Studio) **and** `AI_MODEL` is set. Env vars: `OPENAI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.

#### ADDED: Best-effort rate limit

In-memory sliding window per client IP (~10 req / 10 min) → `429`. Honest limitation documented: not bulletproof across serverless instances; sufficient for casual abuse on a demo.

#### ADDED: Output cap

`maxTokens` on the model call (e.g. 1000) + a design sanity cap (e.g. totalPerMonth ≤ 1.000.000.000 and item count within builder caps) enforced server-side.

#### ADDED: Observability events (PII-safe)

- `ai.request {model, durationMs, toolCalls, ok}` — emitted by the route on completion; **no prompt text**
- `ai.design_applied {chairSku, deskSku, monitorCount, total}` — emitted by the panel on apply (e10s02)
- Both through the existing logger's unified `emit()` (console + Vercel `track()` best-effort, per the existing taxonomy); PII guard applies before emission by construction (no free-text fields).

#### ADDED: Verification & versioning

All unit tests (route + panel + guardrails with mocked provider), full E2E suite (stubbed route), `pnpm preflight`, CI green; **gates run by name** — build-epic step 6 `audit-code --gate` (CONVENTIONS compliance, SOLID, test coverage, no dead code, Boy Scout Rule, supply-chain slopcheck) and verify-work phase-5 `security-review` (data flow, injection, secrets, OWASP spot-check). AUDIT-e10 records both. Release as a feature → **v1.12.0** (minor) — but **not pushed to origin until the user's explicit release signal**.

#### ADDED: Architecture records

ADR 0007 records the AI design route architecture (provider-switchable LLM, tool-based discovery, validation trust boundary — only catalog-validated designs may touch builder state). `specs/security/epics/e10/THREAT_MODEL.md` enumerates prompt injection, budget abuse, rate-limit bypass, cost exposure, and PII risks with mitigations mapped to e10s01/e10s03. New code follows CONVENTIONS.md (TS, exceptions E1–E4, observability O1–O4, accessibility #24) and tests meet the F.I.R.S.T rubric.

## 7. UI/UX

No UI changes beyond e10s02's error states (503/429 surfaced there).

## 8. Data Model

No changes.

## 9. API Contracts

Guardrail responses: `503` disabled, `429` rate-limited (both documented in e10s01's contract).

## 10. Validation Rules

Env-gate predicate; rate-limit window; token + design caps; event payload schema (only whitelisted fields).

## 11. Security

Key stays server-side; prompt never emitted; caps bound the worst case spend (rate limit × output cap); injection mitigated at e10s01.

## 12. Performance

Guardrails are O(1); in-memory map per instance — negligible.

## 13. Accessibility

N/A (server-side).

## 14. Observability

The two new events (above); unit tests assert the exact emitted payloads (no prompt field).

## 15. Error Handling

503/429 as contract; internal guardrail failures never crash the route (try/catch → 500).

## 16. Edge Cases

- Key set but no model → disabled (both required)
- LM Studio dev + no OpenAI key → enabled locally via `AI_BASE_URL`
- Rate limit resets naturally per window
- Multiple instances → per-instance counters (documented limitation)

## 17. Acceptance Criteria

```gherkin
Scenario: Disabled without configuration
  Given no provider/model env vars
  When /api/ai-design is called
  Then 503 ai_disabled

Scenario: Rate limited
  Given more than ~10 requests from one IP in 10 minutes
  When another request arrives
  Then 429

Scenario: Events are PII-safe
  Given a completed design request and apply
  When events are emitted
  Then ai.request and ai.design_applied contain only whitelisted fields and no prompt text

Scenario: Everything green
  Given the full suite
  When preflight + E2E + CI run
  Then all pass, and the version bumps minor on release
```

## 18. Test Plan

Guardrail unit tests (env gate, rate limit window, caps). Event payload tests via the logger mock. Full-suite + E2E + preflight runs as the epic's verification pass.

## 19. Dependencies

e10s01 (route to wrap), e10s02 (apply event emitter). Reuses `scripts/version.ts` flow and the CI workflow.

## 20. Definition of Done

Guardrails in place and tested; both events emitted with no prompt text; full unit + E2E + preflight + CI green; epic verified (AUDIT-e10); version set for v1.12.0; nothing pushed without the user's release signal.
