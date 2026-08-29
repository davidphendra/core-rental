# Story e10s02: Builder "Design with AI" panel

**type:** feature
**risk:** P1
**context:** ui
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 6
**epic:** e10 (AI Workspace Designer)

## 1. Metadata

| Field | Value                          |
| ----- | ------------------------------ |
| ID    | e10s02                         |
| Title | Builder "Design with AI" panel |
| Epic  | e10                            |
| Type  | feature                        |
| Risk  | P1                             |

## 2. Summary

A "Design with AI" panel on the builder page: a free-text input, a Generate action with a 60-second timeout and cancel, a loading state that reveals the AI's tool-call reasoning step-by-step ("searched gaming desk → picked X"), and a preview card showing the proposed items, monthly total, the AI's note, and an Apply action. Apply loads the design into the builder through the existing reducers, replacing the current setup after a confirmation when the cart is non-empty. All failure states (disabled, rate-limited, provider error, invalid output, refusal) degrade gracefully and leave the builder untouched.

## 3. Value

Makes the AI capability visible and trustworthy in the flow where it matters. The reasoning trail turns a black-box "AI suggestion" into an auditable design process; replace-with-confirm protects the user's manual work; graceful errors keep the builder always usable.

## 4. Domain Language

Design, reasoning trail, preview, Apply, Setup, Monthly Total, builder schema.

## 5. Scenarios

- User types a request, generates, sees the reasoning trail, previews the design, applies it
- Non-empty cart + Apply → confirm dialog → replace
- Rate-limited / disabled / provider-error → actionable message, builder untouched
- AI returns a refusal (impossible budget) → refusal message with alternatives
- Cancel during generation → aborts the request

## 6. Requirements (delta)

#### ADDED: DesignWithAI panel (builder page)

- **Input**: textarea/input, trim, disabled while generating, submit on Enter/button
- **Generate**: `POST /api/ai-design { prompt }`; AbortController with 60s timeout; cancel button
- **Loading**: reveals the tool-trail as it completes (client-side steps: "searching catalog…", "checking budget…", "finalizing…") — v1 reveals after completion, step-by-step per e10s01's non-streaming contract
- **Preview card**: items grouped by slot (chair/desk/monitors/accessories), monthly total, AI note, refusal state, error state
- **Apply**: maps the design JSON to builder actions via existing reducers (chair/desk select, monitor slots, exclusive accessories); non-empty cart → confirm dialog; always leaves the builder valid
- **Accessibility**: labelled input, keyboard-operable, live region for generation status, aria states on buttons, focus management on panel open/close
- **Observability**: on apply → `ai.design_applied {chairSku, deskSku, monitorCount, total}` (no prompt text)

## 7. UI/UX

Panel on the builder page (responsive — stacks on mobile), consistent with the app's design tokens; placeholder examples ("try: fancy gaming workspace, max Rp 30 juta"); empty/error/refusal states illustrated with the app's iconography.

## 8. Data Model

No changes. Design JSON maps onto existing `SetupState` via existing reducer actions.

## 9. API Contracts

Consumes `POST /api/ai-design` (e10s01) — handles 200 design, 200 refusal, 400/422/429/503/500.

## 10. Validation Rules

Prompt bound client-side (≤ 500 chars) mirrors the route; design JSON zod-parsed before apply (defense in depth); cart validity rules unchanged.

## 11. Security

Applies only validated designs; no new persistence; prompt stays client-side (never emitted).

## 12. Performance

Single request per generate; 60s timeout; no polling.

## 13. Accessibility

Input label + aria-describedby examples; generation status in a live region; Apply/confirm keyboard + focus-managed; contrast per design tokens.

## 14. Observability

`ai.design_applied {chairSku, deskSku, monitorCount, total}` on successful apply. (No prompt emission anywhere.)

## 15. Error Handling

Disabled (503) → "AI is not configured yet"; rate-limited (429) → "too many requests, wait a moment"; provider error (500/422) → "AI couldn't design that — try rewording"; refusal → show the message + cheapest alternatives; timeout/cancel → abort cleanly.

## 16. Edge Cases

- Empty prompt → disabled generate
- Whitespace-only prompt → same
- Design with no chair/desk → applies but cart stays unroutable (existing gates)
- User edits the builder mid-generation → generation result still applies to the current state (replace semantics)
- Double-submit → single in-flight request enforced

## 17. Acceptance Criteria

```gherkin
Scenario: Full happy path
  Given the builder with an empty cart
  When the user types a request and generates
  Then the reasoning trail is shown, a preview appears, and Apply populates the builder

Scenario: Replace protects manual work
  Given a non-empty cart
  When the user applies a design
  Then a confirmation is required before the cart is replaced

Scenario: Graceful failure
  Given the route returns 429/503/500/refusal
  When the user generates
  Then an actionable message is shown and the builder is unchanged

Scenario: Cancel
  Given a generation in flight
  When the user cancels
  Then the request is aborted and the UI returns to idle
```

## 18. Test Plan

Component tests (panel states, trail, preview, apply mapping, confirm, errors, cancel, accessibility queries). E2E with a stubbed `/api/ai-design` route (builder spec): happy path, replace-confirm, refusal, disabled, cancel.

## 19. Dependencies

e10s01 (route contract). Reducers: existing chair/desk select, `selectMonitor`/`removeMonitorSlot`, `replaceExclusiveAccessory`.

## 20. Definition of Done

Panel renders with a11y queries passing; generate → preview → apply works end-to-end against a stubbed route; replace-confirm protects non-empty carts; all failure states covered; `ai.design_applied` fires with no prompt text; component + E2E tests green.
