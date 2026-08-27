# Security Review — e08 (diff main..HEAD on feat/e08-e2e)

> verify-work step 5. Threat model: specs/security/epics/e08/THREAT_MODEL.md.

## Scope scanned

- e2e/ suite (positive + N1–N11) + playwright.config.ts (root)
- .github/workflows/ci.yml
- next.config.ts CSP change (unsafe-inline for scripts)

## Automated checks

- C1: no secrets/tokens in the CI workflow ✓
- C2: webServer runs a LOCAL production build (`next build && next start`) — tests never touch a deployed site ✓
- C3: @playwright/test pinned via lockfile (14 refs); CI uses `playwright install --with-deps` ✓
- CSP: `'unsafe-inline'` for scripts is a **documented deviation** (F1) — required for Next.js hydration, proven by E2E; accepted because the app has zero injection sinks and CSP still blocks arbitrary hosts + `'unsafe-eval'`
- Belt-and-braces: no `*.test.*` in `.next`, no `toBeInTheDocument` in `.next/static` — test code provably never ships ✓
- N9 asserts the full header posture on all routes + API ✓

## Findings

None new. All C1–C3 LOW and mitigated; the CSP deviation is documented in F1 + SECURITY_PLAN_LATEST.

## Verdict

**PASS** — no HIGH/CRITICAL. No exceptions requested.
