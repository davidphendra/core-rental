# ADR 0003 — Unified catalog + seed generator

- **Status:** Accepted (decisions #19, #30, #31, #32)
- **Context:** The mockups contain ~7 real product images; the requirement demands ≥2 chairs/desks, and the team wants a deep catalog (~55–60 products) where every product has an image. Hand-writing ~55 entries is error-prone and inconsistent.
- **Decision:** One unified `products.json` (categories: chair, desk, accessory, extra, partner) filtered per view. Generated deterministically by `scripts/generate-catalog.ts` + a curated overlay for the 7 hero products (mockup-exact data + Google image URLs). New products get deterministic on-brand SVG placeholder tiles. The catalog is committed and integrity-tested at build time; the route handler serves it via static import.
- **Consequences:** Single source of truth; regenerating after a price tweak is one command; E2E specs import the same catalog for independent arithmetic (decision #37). The motorcycle lives in the same catalog under `category: 'partner'` (decision #20) — structurally excluded from cart/summary, request via modal.
