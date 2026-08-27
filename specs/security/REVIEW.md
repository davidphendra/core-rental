# Security Review — e01 (diff 44adeaf..HEAD)

> verify-work step 5. Diff-scan of the e01 working set (src/ + next.config.ts).
> Baseline: 44adeaf (planning artifacts). Threat model: specs/security/epics/e01/THREAT_MODEL.md.

## Scope scanned

| File                                       | Security-relevant surface                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| next.config.ts                             | CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy; images.remotePatterns (lh3.googleusercontent.com only) |
| src/app/layout.tsx                         | Material Symbols external <link>; Analytics + SpeedInsights beacons; no secrets                                                               |
| src/app/providers.tsx                      | QueryClient singleton                                                                                                                         |
| src/app/global-error-handler.ts            | Global unhandledrejection/error listeners (E4)                                                                                                |
| src/app/error-listeners.tsx                | Mounts listeners                                                                                                                              |
| src/app/loading.tsx, page.tsx, globals.css | No security surface                                                                                                                           |

## Automated checks

- Sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval(`, `new Function`): **none**
- Secrets (`process.env`, api_key, token, secret, password): **none** (only CSS comment word "tokens" — false positive)
- CSP: present, **no `unsafe-eval`**; hosts allowlisted per SECURITY_PLAN_LATEST (fonts.googleapis.com, fonts.gstatic.com, lh3.googleusercontent.com, va.vercel-scripts.com)

## Findings

### F4-adjacent — LOW — global listeners log raw reason (CWE-532)

- **Description:** `global-error-handler.ts` logs `event.reason` / `event.message` to console. A rejection reason could in theory carry data.
- **Verdict:** Acceptable for e01. Console-only sink (no tracking tooling per demo posture); structured `logger` upgrade at e03s03 makes the sink PII-free by construction (O3). No action blocks this gate.

## Verdict

**PASS** — no HIGH/CRITICAL findings. LOWs documented above; no exceptions requested.
