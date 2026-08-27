# Story e01s02: Config & security shell

**type:** feat
**risk:** P1
**context:** infra
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e01 (Project Scaffold & Tooling)

## 1. Metadata

| Field | Value                   |
| ----- | ----------------------- |
| ID    | e01s02                  |
| Title | Config & security shell |
| Epic  | e01                     |
| Type  | feat                    |
| Risk  | P1                      |

## 2. Summary

Configure the app's security posture and global shell: CSP + security headers, image allowlist, root layout with fonts/providers/metadata, loading skeleton, and global error listeners. Implements decisions #13, #29, D2, D6, E4.

## 3. Value

Ships the trust boundary early: headers and CSP are visible from the first deploy, and the root shell (layout, loading, listeners) is the frame every feature renders inside.

## 4. Domain Language

CSP, remotePatterns, layout, providers, skeleton (GLOSSARY: Core Rental).

## 5. Scenarios

- All routes respond with CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy
- Remote images only from `lh3.googleusercontent.com` + local
- Route chunk loads show the brand loading skeleton
- Unhandled rejections log as structured `error` events (E4)

## 6. Business Rules

Decisions #13 (headers/CSP), #29 (loading), D2 (metadata/OG), D6 (fonts: next/font + Material Symbols link), O1 (Analytics + SpeedInsights mounted), E4 (global listeners).

## 7. UI/UX

Root skeleton matches the tropical-tech palette (light). Fonts: Plus Jakarta Sans + Manrope via next/font; Material Symbols via `<link>` (protects FILL axis, D6).

## 8. Data Model

None.

## 9. API Contracts

None (HTTP headers are response-level contracts — asserted by E2E N9).

## 10. Validation Rules

N/A.

## 11. Security

CSP per SECURITY_PLAN_LATEST: default-src 'self'; script-src 'self' + va.vercel-scripts.com; style-src 'self' 'unsafe-inline' + fonts.googleapis.com; font-src 'self' + fonts.gstatic.com; img-src 'self' + lh3.googleusercontent.com + data: + blob:; connect-src 'self' + va.vercel-scripts.com; frame-ancestors 'none'.

## 12. Performance

next/font self-hosts text fonts (no layout shift, no external font requests).

## 13. Accessibility

Skeleton uses reduced-motion-friendly shimmer; providers don't affect a11y.

## 14. Observability

Global `unhandledrejection`/`error` listeners → `logger.error` (E4). Analytics + SpeedInsights mounted (O1).

## 15. Error Handling

N/A at shell level (boundaries land in e07s03).

## 16. Edge Cases

- CSP `unsafe-inline` style needed for Tailwind inline styles — pragmatic per decision #13
- Material Symbols FILL axis must survive (D6 rationale)

## 17. Acceptance Criteria

```gherkin
Scenario: Security headers present
  Given the production app is running
  When a request hits any route
  Then the response includes Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy

Scenario: Global error capture
  Given an unhandled promise rejection occurs
  When the app is running
  Then a structured error event is logged (logger)
```

## 18. Test Plan

E2E N9 asserts headers on all routes (e08s02). Curl-based header check in task e01s02-1.

## 19. Dependencies

e01s01 (scaffold). Provides layout frame for e04–e07.

## 20. Definition of Done

Headers + CSP verified on all routes; remotePatterns allowlist active; layout renders fonts/providers/metadata; loading skeleton shows on chunk load; global listeners log structured errors.
