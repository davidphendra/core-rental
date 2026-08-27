# Threat Model — e04 (Home Feature)

> build-epic Step 0 · scope-based threat modeling from the e04 epic capsule.
> The home page is a **server component** (decision #25) with no user input, no
> cart interaction, and no client state — the smallest threat surface in the app.

## Surface area (e04 scope)

| Surface                       | Files                           | Notes                                   |
| ----------------------------- | ------------------------------- | --------------------------------------- |
| Hero + floating product cards | `features/home/components/*`    | Catalog-driven display (validated data) |
| How-it-Works                  | `features/home/components/*`    | Static copy (step-2 rewritten, C6)      |
| Metadata/OG                   | `src/app/page.tsx` (home)       | Server-side metadata (D2)               |
| Nav                           | `shared/ui/SiteHeader` (shared) | Route links; no avatar (C5)             |

## Findings

### H1 — Floating card images — LOW (inherited)

- **Description:** Cards render catalog product images (Google URLs + placeholders).
- **Exploit scenario:** A broken image shows a broken tile.
- **Mitigation (planned):** Hosts allowlisted (e01, #13); shared `ProductCard` onError → local fallback (N7, tested). No user-controlled src.
- **Task mapping:** e04s01-1.

### H2 — Anchor nav vs routes — NONE

- The mockup's home header anchors to `#how-it-works`/`#builder`/`#store` sections; the port uses the shared `SiteHeader` with real routes. No security surface; noted for design consistency.

### H3 — Metadata/OG — NONE

- Server-rendered metadata (D2) carries no user data and no inputs.

## Risk summary

| ID  | Finding                 | Severity | CWE |
| --- | ----------------------- | -------- | --- |
| H1  | Card images (inherited) | LOW      | —   |
| H2  | Nav (design note)       | NONE     | —   |
| H3  | Metadata (none)         | NONE     | —   |

**Epic-level risk: LOW** — no HIGH/CRITICAL; no WSJF boost. All surfaces inherited or inert.

## Verification & gates

- E2E N9 (headers on /) + home smoke already covered by page-shell.spec.ts
- Unit tests: hero render, step-2 copy (C6), no avatar (C5)
- Security diff-scan at verify-work Phase 5
