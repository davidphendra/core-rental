# Threat Model — e08 (E2E Suite & CI)

> build-epic Step 0 · scope-based threat modeling from the e08 epic capsule.
> e08 is verification-heavy: the Playwright suite + CI gate PROVE the security
> posture of e01–e07 (N7–N11) rather than adding new application surface.

## Surface area (e08 scope)

| Surface       | Files                                    | Notes                                                                     |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| E2E suite     | `e2e/*.spec.ts` + `playwright.config.ts` | Runs against a LOCAL production build (never the deployed site)           |
| Test fixtures | `e2e/fixtures/*`                         | Import committed `products.json`; seed test-local storage (N10 by design) |
| CI workflow   | `.github/workflows/ci.yml`               | lint → typecheck → unit+coverage → build → E2E → marker grep              |
| README        | `README.md`                              | Deploy section (Vercel story)                                             |

## Findings

### C1 — CI secret hygiene — LOW — CWE-798 (adjacent)

- **Description:** The workflow must never embed credentials; Vercel zero-config deploy needs no token today.
- **Exploit scenario:** A future deploy step inlines a token into the workflow file.
- **Mitigation (planned):** Workflow uses only checkout + setup-node + pnpm steps; **no env/secrets**; CONVENTIONS.md rule: any future deploy credential goes in GitHub Secrets, never the file. Vercel zero-config auto-deploys on push to main (decision: no `vercel.json`, no token).
- **Task mapping:** e08s02-2 (`security: medium`).

### C2 — Test data isolation — LOW

- **Description:** E2E runs a local production build; N10 seeds corrupt localStorage into the test browser only.
- **Exploit scenario:** N/A — no production site is touched; fixtures import the committed catalog (developer-authored).
- **Mitigation (planned):** `webServer` starts `next build && next start` locally; every spec clears localStorage in `beforeEach` (reset-state fixture). Accepted by construction.
- **Task mapping:** e08s01-1.

### C3 — Playwright browser supply chain — LOW — CWE-1104 (adjacent)

- **Description:** `npx playwright install` downloads Chromium in CI.
- **Exploit scenario:** Tampered browser binary.
- **Mitigation (planned):** `@playwright/test` pinned via lockfile; the Playwright installer verifies downloads (its own integrity checks); CI caches the browser. Standard practice; accepted.
- **Task mapping:** e08s01-1, e08s02-2.

### C4 — Verification value (not a finding)

- **N9** asserts the CSP + header posture on all routes (e01's policy becomes machine-checked) · **N10** proves the trust boundary (corrupt storage → defaults) · **N8** proves the API-failure path stays friendly · **N7** proves image fallback. This epic is where the security work of e01–e07 gets its end-to-end proof.

## Risk summary

| ID  | Finding                                | Severity | CWE      |
| --- | -------------------------------------- | -------- | -------- |
| C1  | CI secret hygiene (no tokens in file)  | LOW      | CWE-798  |
| C2  | Test data isolation (local build only) | LOW      | —        |
| C3  | Playwright browser supply chain        | LOW      | CWE-1104 |
| C4  | Verification value                     | NONE     | —        |

**Epic-level risk: LOW** — no HIGH/CRITICAL; no WSJF boost. C1 mitigated by no-secrets-in-workflow rule; N9/N10 are security proofs.

## Verification & gates

- The suite itself is the gate: N1–N11 + positive flows must pass in CI (decision #35/#36)
- Belt-and-braces: grep `.next/static` for a test-only marker — proves no test code ships (C2-adjacent)
- Security diff-scan at verify-work Phase 5 (test files excluded from production bundling — tsconfig `exclude: e2e`)
