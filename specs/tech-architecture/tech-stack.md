# Tech Stack — Core Rental

> Derived from the confirmed decision record (`specs/DECISION_RECORD.md`) — no code exists yet; this document is written forward from decisions, not from a codebase scan.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack)** | Angular dropped (ADR 0001). No third-party bundler: Turbopack bundles, SWC compiles/minifies |
| UI | React 19, Tailwind CSS v4 | tropical-tech tokens, light mode only |
| Data | TanStack Query v5 | Client fetch from route handler `/api/products`; cache survives navigation |
| Persistence | localStorage | Custom hook + BuilderStore; quota-guarded writes; validate-and-fallback hydration |
| i18n | English only (MVP) | Deferred; flat routes retrofit-friendly |
| Currency | IDR only | `Intl.NumberFormat('id-ID')` — single home in `shared/domain/pricing.ts` |
| Language | TypeScript strict | `strict: true`, `noUncheckedIndexedAccess`, zero `any` |
| Tooling | pnpm · Node 20 LTS | `.nvmrc` + `engines` |
| Lint/Format | ESLint (`eslint-config-next`) · Prettier + `prettier-plugin-tailwindcss` · husky/lint-staged | Feature-boundary lint rules |
| Unit tests | Vitest + React Testing Library | Colocated `*.test.ts(x)`; 80% branch gate on `shared/domain` |
| E2E | Playwright (Chromium) | `e2e/` at repo root; production build via webServer |
| Observability | `@vercel/speed-insights` · `@vercel/analytics` · structured `logger.ts` | Vercel-native (ADR 0006) |
| Deploy | Vercel (zero-config) | No `vercel.json`, no `vercel` package |

## Repository structure (proposed — not yet scaffolded)

```
core-rental/
├── .github/workflows/ci.yml        # PR gate: lint → typecheck → unit → coverage → build → e2e
├── .husky/pre-commit               # lint-staged
├── .nvmrc                         # Node 20 LTS
├── e2e/                            # Playwright (root-level, distinct from colocated Vitest)
│   ├── playwright.config.ts
│   ├── fixtures/                   # reset-state.ts · catalog-helpers.ts (spec-local arithmetic)
│   ├── builder.spec.ts             # positive builder + N3, N4, N5
│   ├── store.spec.ts               # positive store + N6
│   ├── summary.spec.ts             # positive rent + N1, N11
│   ├── page-shell.spec.ts          # N2 (404), N9 (headers)
│   └── resilience.spec.ts          # N7 (image fallback), N8 (API failure), N10 (corrupt storage)
├── scripts/
│   ├── generate-catalog.ts         # deterministic catalog builder
│   └── curated-hero.ts             # the 7 designed products' real data
├── public/
│   ├── fallback/                   # onError placeholder
│   └── placeholders/               # generated SVG tiles
├── src/
│   ├── app/
│   │   ├── layout.tsx              # fonts (next/font), metadata+OG, providers, Analytics+SpeedInsights
│   │   ├── page.tsx                # /            (server component)
│   │   ├── globals.css             # Tailwind + tropical-tech tokens
│   │   ├── builder/page.tsx        # /builder     (client)
│   │   ├── store/page.tsx          # /store       (client)
│   │   ├── summary/page.tsx        # /summary     (client)
│   │   ├── api/products/route.ts   # catalog API — static import + contract guard
│   │   ├── not-found.tsx           # playful 404 + funnel CTAs
│   │   ├── error.tsx               # Client Component boundary: reset + home + structured log
│   │   ├── global-error.tsx        # own <html>/<body>
│   │   └── loading.tsx             # brand skeleton
│   ├── features/
│   │   ├── home/                   # index.ts barrel · components/
│   │   ├── builder/                # index.ts · components/ (Canvas, SelectionPanel, CanvasSlot, StickySummaryBar, QuantityStepper) · hooks/
│   │   ├── store/                  # index.ts · components/ (StoreGrid, StoreCard, CategoryFilter, PartnerRequestModal)
│   │   └── summary/                # index.ts · components/ (SummaryView, LineItemRow, ZoneTiles, EmptyState, ConfirmationScreen)
│   └── shared/
│       ├── data/                   # products.json (generated, committed) · products.ts (sole reader) · useProducts.ts
│       ├── domain/                 # pricing.ts · setupRules.ts · validateSetupState.ts (+ colocated tests)
│       ├── state/                  # BuilderStore.tsx · useLocalStorage.ts (quota-guarded)
│       ├── hooks/                  # useBuilderStore.ts
│       ├── ui/                     # ProductCard · PriceTag · Button · LoadingSkeleton · ErrorState
│       ├── types/                  # product.ts (Product, Category incl. 'partner') · setup.ts
│       ├── config/                 # site.ts (brand, nav) · images.ts (remotePatterns)
│       └── observability/          # logger.ts (JSON lines, PII-free) (+ tests)
├── .env.example                    # empty template — no secrets in client
├── eslint.config.mjs
├── .prettierrc
├── next.config.ts                  # headers() CSP + images.remotePatterns
├── tsconfig.json                   # strict + noUncheckedIndexedAccess, @/* → ./src/*
├── tailwind.config.ts              # tropical-tech tokens
├── postcss.config.mjs
├── vitest.config.ts
├── package.json                    # pnpm, engines Node 20
├── README.md                       # incl. Deploy section (Vercel story)
└── CONVENTIONS.md                  # principles: 12–17, 24, D5, E, O
```

## Architecture

- **Feature-based vertical slices** (ADR 0002): `features/<feature>` with `index.ts` public barrels; cross-feature imports only via barrels (enforced by lint rules). One component/hook/module per file.
- **Shared layers:** `data` (repository), `domain` (pure services — zero React), `state` (cross-feature cart), `hooks`, `ui` (primitives), `types`, `config`, `observability`.
- **Routing:** file-based; `<Link>` for nav + `router.push()` for programmatic; code-split route chunks with root `loading.tsx`; flat routes (i18n retrofit-ready).
- **State & persistence:** `BuilderStore` (context + reducer, validates via `setupRules`) in root layout; `useLocalStorage` with quota guard (E3); hydration via `validateSetupState` (G1) with fallback to D1 defaults (first chair + first desk).
- **Data flow:** `/api/products` (static import + contract guard, E2) → TanStack Query (`useProducts`) → features; query cache survives navigation; shared `LoadingSkeleton`/`ErrorState` (D4).
- **Error model:** render errors → `error.tsx`/`global-error.tsx`; unknown URLs → `not-found.tsx`; fetch failures → query `ErrorState`; I/O exceptions → targeted try/catch with degradation (E1–E3); last-mile → global listeners (E4). Raw errors never reach users.
- **Observability:** `logger.ts` JSON events per O2 taxonomy, PII-free by construction (O3); Speed Insights + Analytics mounted in layout; lightweight timing traces (O4).

## Key domain logic

- `pricing.ts` — IDR formatting (`Intl.NumberFormat('id-ID')`), monthly total = sum of line items (flat monthly, decision #7).
- `setupRules.ts` — caps config table (monitors ≤ 3, plants ≤ 4, lamps ≤ 2, coffee = 1, bean bag ≤ 2, surfboard = 1), exclusivity (single chair/desk), partner exclusion.
- `validateSetupState.ts` — hydration validation: shape + business rules; any failure → defaults.
