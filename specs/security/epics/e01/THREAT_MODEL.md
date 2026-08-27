# Threat Model — e01 (Project Scaffold & Tooling)

> Generated at build-epic Step 0. Mode: **scope-based threat modeling** from the
> e01 epic capsule (no code/git exists yet — the diff-scan mode of security-review
> becomes applicable from e01s01 onward, and reruns at verify-work Phase 5).
> Risk levels inform the `security:` field on tasks and the WSJF boost rule
> (boost only if HIGH/CRITICAL — none found).

## Surface area (e01 scope)

| Surface | Files | Notes |
|---|---|---|
| HTTP security headers + CSP | `next.config.ts` | Applied to all routes at the edge |
| Remote image policy | `next.config.ts` `images.remotePatterns` | Gates next/image hosts |
| Client bundle contents | `src/app/layout.tsx` + app tree | Fonts, providers, metadata, analytics beacons |
| External resource loads | Google Fonts `<link>` (Material Symbols), Vercel analytics beacon | Runtime third-party hosts |
| Global error listeners | layout / shared module (E4) | unhandledrejection/error → logger |
| Env/secrets handling | `.env.example` | Empty template by design |
| Loading UI | `src/app/loading.tsx` | No user data |

## Findings

### F1 — CSP misconfiguration — MEDIUM — CWE-693 (Protection Mechanism Failure)
- **Description:** A weak or drifted Content-Security-Policy silently removes the app's main client-side protection.
- **Exploit scenario:** If `script-src` is later loosened (e.g., `'unsafe-eval'` or an extra host added without review), a compromised third-party script or injected inline script executes.
- **Mitigation (planned):** CSP per `SECURITY_PLAN_LATEST` — `script-src 'self' https://va.vercel-scripts.com`; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `font-src 'self' https://fonts.gstatic.com`; `img-src 'self' https://lh3.googleusercontent.com data: blob:`; `connect-src 'self' https://va.vercel-scripts.com`; `frame-ancestors 'none'`. No `'unsafe-eval'`. E2E **N9** asserts headers on every route; any future host addition requires a CONVENTIONS.md review note.
- **Task mapping:** e01s02-1 (`security: high`).

### F2 — External script inclusion without SRI — LOW — CWE-829 (Untrusted Control Sphere)
- **Description:** Material Symbols loads via Google Fonts `<link>`; Vercel analytics injects a beacon script. Neither uses SRI.
- **Exploit scenario:** Compromise of the font CDN could alter rendering (style-level); analytics script compromise could exfiltrate page data.
- **Mitigation (planned):** Hosts strictly allowlisted in CSP (no arbitrary domains); text fonts self-hosted via `next/font` (no external request); Material Symbols is display-only with `crossorigin` link per Google's recommended markup. Remaining risk accepted as LOW (decision D6 trade-off, documented in ADR 0006/0001 context).
- **Task mapping:** e01s02-2.

### F3 — Secrets in client bundle — MEDIUM — CWE-798 (Hard-coded Credentials)
- **Description:** A developer could inline a key/token into a client component or `.env` reference that ships.
- **Exploit scenario:** Bundled secret → scraped from `.next/static` by anyone.
- **Mitigation (planned):** `.env.example` empty template; CONVENTIONS.md NEVER-rule ("no secrets in client code"); belt-and-braces CI grep scans `.next/static` for test markers (and can be extended for secret patterns); lint config blocks common secret patterns if adopted.
- **Task mapping:** e01s01-4, e08s02-2 (`security: medium`).

### F4 — Sensitive data in logs — LOW — CWE-532 (Insertion of Sensitive Information into Log File)
- **Description:** Global error listeners + structured logger could log request context containing personal data.
- **Exploit scenario:** Delivery address (later e07) or an error message containing user input lands in Vercel logs, queryable.
- **Mitigation (planned):** `logger` is PII-free **by construction** (O3 — no address field exists in the API); listeners log error name/message only; `delivery.submitted` logs `hasAddress`/`addressLength` (e07s01). Enforced by `logger.test.ts` PII-absence test.
- **Task mapping:** e03s03-3 (`security: medium`), e07s02-2.

### F5 — Unsafe inline scripting (Tailwind CDN) — LOW — CWE-829
- **Description:** The mockups load `cdn.tailwindcss.com` — a runtime script that must never ship.
- **Exploit scenario:** Shipping the CDN script would add an un-allowlisted external script and block-style CSS injection surface.
- **Mitigation (planned):** Compiled Tailwind v4 only (decision #13); CONVENTIONS.md NEVER-do list bans the CDN script; CI build would fail CSP N9 assertions if it ever shipped (CSP `script-src` blocks it).
- **Task mapping:** e01s01-2.

### F6 — Supply-chain / dependency drift — MEDIUM — CWE-1104 (Unmaintained Components)
- **Description:** Next.js/React/Tailwind/TanStack/deps could drift to vulnerable versions.
- **Exploit scenario:** Known-CVE dependency ships to production via lockfile update.
- **Mitigation (planned):** pnpm lockfile committed; pinned majors (Next 16, React 19, Tailwind v4, TanStack Query v5); CI gates (lint/typecheck/build/e2e) on every PR; `npm audit`/`pnpm audit` can be added to CI as a cheap check — recommend folding into e08s02-2 CI step.
- **Task mapping:** e08s02-2.

### F7 — Remote image allowlist gap — LOW — CWE-918 (SSRF, adjacent)
- **Description:** An overly broad `remotePatterns` would let next/image fetch arbitrary hosts (abuse/SSRF-adjacent).
- **Exploit scenario:** Misconfigured pattern (e.g., `https://**`) allows internal/private host fetches through the image optimizer.
- **Mitigation (planned):** Only `lh3.googleusercontent.com` (product images, decision #31) + local placeholders; no wildcard hostnames. E2E N9 asserts headers; image behavior exercised by N7.
- **Task mapping:** e01s02-1.

## Risk summary

| ID | Finding | Severity | CWE |
|---|---|---|---|
| F1 | CSP drift | MEDIUM | CWE-693 |
| F2 | External script hosts | LOW | CWE-829 |
| F3 | Secrets in bundle | MEDIUM | CWE-798 |
| F4 | Sensitive log data | LOW | CWE-532 |
| F5 | Tailwind CDN script | LOW | CWE-829 |
| F6 | Dependency drift | MEDIUM | CWE-1104 |
| F7 | Image allowlist gap | LOW | CWE-918 |

**Epic-level risk: LOW** — no HIGH/CRITICAL findings; no WSJF boost applies (plan-release rule).

## Verification & gates

- E2E N9 (security headers) — all routes, production build (e08s02)
- Belt-and-braces `.next/static` marker grep in CI (e08s02-2)
- `security:` task fields set: e01s02-1 `high`; e03s03-3 / e08s02-2 `medium`; others `low`/`none`
- Rerun security-review in **diff-scan mode** at verify-work Phase 5 for each story once code exists
