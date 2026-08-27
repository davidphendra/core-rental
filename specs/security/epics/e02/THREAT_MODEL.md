# Threat Model — e02 (Catalog & Seed Generation)

> build-epic Step 0 · scope-based threat modeling from the e02 epic capsule (no e02 code yet).
> Risk levels inform `security:` fields; WSJF boost applies only if HIGH/CRITICAL (none found).

## Surface area (e02 scope)

| Surface                     | Files                                                        | Notes                                                                 |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Catalog generation pipeline | `scripts/generate-catalog.ts`, `scripts/curated-hero.ts`     | Developer-authored data templates; writes `products.json` + SVG tiles |
| Generated assets            | `src/shared/data/products.json`, `public/placeholders/*.svg` | Committed artifacts served by Next.js                                 |
| Catalog API                 | `src/app/api/products/route.ts`                              | Read-only; static import + contract guard (E2)                        |
| Typed data layer            | `shared/data/products.ts`, `shared/types/product.ts`         | Sole reader; client-side                                              |
| Query hook                  | `shared/data/useProducts.ts`                                 | TanStack Query client fetch                                           |

## Findings

### S1 — API error message exposure — LOW — CWE-209 (Information Exposure Through Error Message)

- **Description:** The route handler could leak internals (file paths, stack) in error responses.
- **Exploit scenario:** A malformed payload triggers an error; a verbose response reveals server structure to a probing client.
- **Mitigation (planned):** Contract guard returns generic `500 {"error":"Products unavailable"}` (E2). No internals. E2E N8 asserts the friendly in-page ErrorState; unit test asserts the generic 500 shape.
- **Task mapping:** e02s02-1 (`security: low`).

### S2 — SVG content injection — LOW — CWE-79 (XSS, adjacent)

- **Description:** SVG tiles generated from product names could carry script content if names were attacker-controlled.
- **Exploit scenario:** A product name containing `<script>` renders as active SVG content on the same origin.
- **Mitigation (planned):** Product names are **developer-authored** (generator templates + curated hero overlay) — no user input reaches the generator (decision #19/#32). Accepted by construction; integrity tests additionally assert name/id shape. No user-controlled input surface exists in e02.
- **Task mapping:** e02s01-2/4.

### S3 — Generator file-write safety — LOW — CWE-22 (Path Traversal, adjacent)

- **Description:** Slug-derived output paths could escape intended directories.
- **Exploit scenario:** A crafted slug writes outside `public/placeholders/`.
- **Mitigation (planned):** Slugs are developer-authored constants, not user input; integrity tests validate slug charset. Accepted by construction.
- **Task mapping:** e02s01-2.

### S4 — Remote image allowlist coverage — LOW (inherited, verified)

- **Description:** Hero products use Google-hosted URLs; the image host must remain allowlisted.
- **Exploit scenario:** An un-allowlisted image host breaks the optimizer or is blocked by CSP.
- **Mitigation (planned):** `images.remotePatterns` already restricted to `lh3.googleusercontent.com` (e01, verified in E2E N9). No change needed for e02.
- **Task mapping:** e02s01-1 (hero URLs) + N9.

## Risk summary

| ID  | Finding                                      | Severity | CWE     |
| --- | -------------------------------------------- | -------- | ------- |
| S1  | API error exposure                           | LOW      | CWE-209 |
| S2  | SVG injection (by-construction safe)         | LOW      | CWE-79  |
| S3  | Generator path safety (by-construction safe) | LOW      | CWE-22  |
| S4  | Image allowlist coverage                     | LOW      | —       |

**Epic-level risk: LOW** — no HIGH/CRITICAL; no WSJF boost. Mitigations are design-level (generic 500, developer-authored data, allowlisted hosts), verified by integrity tests + E2E N8/N9.

## Verification & gates

- e02s02-1 contract-guard unit test (generic 500) + E2E N8
- e02s01-4 integrity tests (types, categories, counts, slug charset, determinism)
- Security diff-scan reruns at verify-work Phase 5 with real code
