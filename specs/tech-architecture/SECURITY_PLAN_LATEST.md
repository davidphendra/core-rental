# Security Plan — Core Rental (SECURITY_PLAN_LATEST)

> Decisions: #13 (headers/CSP), #12 (strict TS), G1–G3 (validation), E1–E4 (exceptions), O3 (PII/CSP), #25 (no input surface).

## Trust boundary — the app never trusts user data

| Surface                                                       | Protection                                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Rendered text (incl. delivery address echoed in confirmation) | XSS-safe by construction: React escapes all strings; `dangerouslySetInnerHTML` is **forbidden** |
| `/api/products`                                               | Read-only, no params/body — no server-side input surface                                        |
| URL/query params                                              | None exist; unknown URLs → 404                                                                  |
| localStorage hydration                                        | `validateSetupState` (G1): shape + business rules; any failure → defaults                       |
| Reducer actions                                               | Validated via `setupRules` (G2): over-cap / partner adds rejected as no-ops                     |
| Delivery Location input                                       | Trim + non-empty + max 200 chars; inline error; Rent disabled until valid (G3)                  |

## HTTP security headers (decision #13)

Set via `headers()` in `next.config.ts` on all routes:

- `Content-Security-Policy` (below)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera=(), microphone=(), geolocation=() baseline)

## Content-Security-Policy (decisions #13, D6, O3)

Pragmatic policy — no nonce ceremony (Tailwind inline styles need `'unsafe-inline'` for style):

- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com` — **`'unsafe-inline'` is a documented deviation**: Next.js hydration requires inline bootstrap scripts (proven by E2E; strict script-src breaks the app). Accepted because the app has zero injection sinks (no `dangerouslySetInnerHTML`, enforced) and CSP still blocks arbitrary hosts + `'unsafe-eval'`. Nonce-based CSP is the documented future hardening path.
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Material Symbols `<link>` (D6)
- `font-src 'self' https://fonts.gstatic.com` — Material Symbols font files (D6)
- `img-src 'self' https://lh3.googleusercontent.com data: blob:` — hybrid product images (decision #31)
- `connect-src 'self' https://va.vercel-scripts.com`
- `frame-ancestors 'none'`

`next/font` (Plus Jakarta Sans, Manrope) is self-hosted at build — no external font hosts needed for text.

## Other hygiene

- **No secrets in client code** — `.env.example` empty template; nothing secret ever referenced from client components
- **Raw errors never rendered** — error.tsx shows generic copy only; `logger.error('error.boundary', …)` carries name/message, never to users (decision #28)
- **No PII in logs** — logger API structurally cannot accept the delivery address (O3); `delivery.submitted` logs `hasAddress`/`addressLength` only
- **Compiled Tailwind only** — the mockups' `cdn.tailwindcss.com` script must never ship (build-time Tailwind v4 replaces it)
- **Next.js image allowlist** — `images.remotePatterns` permits only `lh3.googleusercontent.com` (+ local placeholders); no arbitrary hosts
- **Dependency hygiene** — pnpm lockfile committed; CI lint/typecheck/build gates

## Verification

- E2E N9 asserts the headers + CSP on all four routes (page-shell.spec.ts)
- E2E N8 asserts the API-failure path stays friendly
- Unit tests assert logger emits no address field (PII-absence)
