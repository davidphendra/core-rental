# Security Review — e05 (diff main..HEAD on feat/e05-builder)

> verify-work step 5. Threat model: specs/security/epics/e05/THREAT_MODEL.md.

## Scope scanned

- src/features/builder/* — canvas slots, selection panel, steppers, sticky bar, page wiring
- src/shared/ui — SiteHeader, BottomNav, ProductCard (selected state)
- src/shared/domain/setupRules.ts — defaultsIfEmpty addition

## Automated checks

- Sinks (`innerHTML`, `eval(`, `new Function`, `dangerouslySetInnerHTML`): **none**
- Secrets: **none**
- Cap enforcement: UI (`atCap`) AND reducer (`canAdd`) — defense in depth (B1)
- Keyboard handlers gate on `event.key` (B2)
- Image sources from catalog only + fallback (B4)

## Findings

None new. All B1–B4 are LOW and design-mitigated; N3/N5/N10 behaviors test-verified.

## Verdict

**PASS** — no HIGH/CRITICAL. No exceptions requested.
