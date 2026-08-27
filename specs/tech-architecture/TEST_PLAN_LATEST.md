# Test Plan — Core Rental (TEST_PLAN_LATEST)

> Decisions: #16 (unit/integration), #34–38 (E2E), D3 (coverage gate), G4 (validation E2E), #32 (generator integrity).

## Test layers

| Layer | Runner | Location | Scope | Gate |
|---|---|---|---|---|
| Unit | Vitest | Colocated `*.test.ts(x)` beside source | Pure domain: `pricing`, `setupRules`, `validateSetupState`; logger (format, levels, PII-absence); generator integrity | **80% branch coverage on `shared/domain`**, CI-enforced |
| Integration | Vitest | Colocated | Module combos: BuilderStore + setupRules + pricing → correct totals; reducer rejects invalid actions (G2); localStorage hydration validate-and-fallback (G1) | Runs in CI |
| E2E | Playwright | `e2e/` at repo root | Full UI regression vs **production build** (`webServer`: `next start` after `next build`) | Runs after unit/integration in CI; gates merges |

## E2E suite (decisions #35, #38)

- **Positive flows** — real-browser user mimicry; **assert rendered text**: items present on confirmation page + IDR total matches spec-local arithmetic (import `products.json`, never app logic — #37)
  - builder.spec.ts: select chair/desk, stack 2 monitors via stepper, verify sticky IDR total updates, surfboard on store, summary line items + total, Rent → confirmation
- **Negative flows N1–N11:**
  - N1 empty cart on /summary → empty state + CTA (summary.spec.ts)
  - N2 unknown URL → playful 404 + funnel CTAs (page-shell.spec.ts)
  - N3 quantity cap — stepper disabled at cap (builder.spec.ts)
  - N4 remove/descale — total decreases, line items drop (builder.spec.ts)
  - N5 chair/desk exclusivity — second selection replaces first (builder.spec.ts)
  - N6 partner exclusion — motorcycle request → modal confirmation; absent from cart/summary (store.spec.ts)
  - N7 broken image — intercept+abort image request → onError fallback renders (resilience.spec.ts)
  - N8 API failure — intercept+abort `/api/products` → in-page ErrorState (resilience.spec.ts)
  - N9 security headers — assert CSP + frame/type/referrer/permissions headers on all routes (page-shell.spec.ts)
  - N10 corrupt storage — seed garbage via `addInitScript` → app renders D1 defaults, no crash (resilience.spec.ts)
  - N11 delivery input validation — empty/121-char → inline error + Rent disabled; valid → enabled (summary.spec.ts)

## CI workflow (decisions #14, #36, D3, D5)

Order per PR: install (pnpm) → lint → typecheck → unit + integration (with coverage gate) → `next build` → Playwright vs production build → belt-and-braces assertion: grep `.next/static` for a test-only marker (proves no test code ships).

## Expectations discipline (#37)

E2E specs import `products.json` and compute expected totals with plain spec-local arithmetic. They must never import `pricing.ts` / `setupRules.ts` / `validateSetupState.ts` from the app — otherwise a pricing bug passes the E2E.
