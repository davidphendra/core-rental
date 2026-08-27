# Conventions — Core Rental

Shared rules for all agents and contributors. Violations fail review.

## Project

- **Core Rental** — rent fully-equipped office setups to Bali digital nomads.
- Tagline: "Your Bali Office, Delivered." Brand name is **Core Rental** — never "Moni's Workspace".
- Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 · TanStack Query v5 · pnpm · Node 20 LTS.
- See `specs/DECISION_RECORD.md` (65 confirmed decisions) before any code.

## Commands

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev | `pnpm dev` |
| Unit/integration | `pnpm test` (Vitest) |
| Coverage | `pnpm test -- --coverage` (80% branch on `shared/domain`) |
| Lint | `pnpm lint` (eslint-config-next) |
| Format | `pnpm format` (Prettier) |
| Typecheck | `pnpm typecheck` (tsc --noEmit) |
| Build | `pnpm build` (next build) |
| E2E | `pnpm test:e2e` (Playwright vs production build) |
| Preflight | `pnpm preflight` (test + lint + typecheck + build chained) |

## Architecture (ADR 0002)

- Feature-based vertical slices in `src/features/{home,builder,store,summary}`; cross-cutting code in `src/shared/{data,domain,state,hooks,ui,types,config,observability}`.
- **One component/hook/module per file.** Do not put multiple units in one file.
- Feature internals are private: import only through the feature's `index.ts` barrel. Lint rules enforce this.
- Domain logic (`shared/domain`) is pure — **zero React imports**. Business rules (pricing, caps, validation) live there, not in components.
- Tests colocate beside source (`*.test.ts(x)`); E2E lives in `e2e/` at the repo root.

## TypeScript (decision #12)

- `strict: true`, `noUncheckedIndexedAccess`, zero `any` — project-wide, every file inherits. Do not weaken tsconfig per-file.
- Shared domain types in `shared/types` (`Product`, `SetupState`); the catalog is the single source of truth for product data.

## Security (decisions #13, G1–G3, O3)

- NEVER use `dangerouslySetInnerHTML`. React escaping is the XSS boundary.
- NEVER put secrets in client code. `.env.example` is the only env template.
- NEVER log the delivery address or any PII. The logger API cannot accept it — keep it that way.
- Never render raw error text to users. Generic copy + recovery only (error.tsx).
- Validate every untrusted input: localStorage hydration (validate-and-fallback), reducer actions (setupRules), delivery input (trim, non-empty, ≤120 chars).

## Exceptions (E1–E4)

- try/catch ONLY at I/O boundaries (route handler, localStorage writes, async handlers). Do not blanket-wrap; TanStack Query and pure domain functions handle errors natively.
- On storage write failure: warn + degrade to in-memory. Never crash the cart.

## Observability (O1–O4)

- Log structured JSON via `logger.ts` — one event per taxonomy entry: `info` (rent.clicked, partner.requested, delivery.submitted, catalog.loaded, catalog.failed) · `warn` (storage.degraded, validation.rejected) · `error` (error.boundary, unhandled rejections) · `debug` (cart.updated).
- Do not invent new event names; extend the taxonomy in `specs/DECISION_RECORD.md` first.

## Git (decision D5)

- Conventional Commits: `feat(builder): …`, `fix(pricing): …`, `test(e2e): …`, `chore: …`, `refactor: …`, `docs: …`. Pre-commit hook enforces format.
- Feature branches off `main` (`feat/<slug>`, `fix/<slug>`) merged via PR.
- Every PR must pass the full CI gate: lint → typecheck → unit + coverage → build → E2E. `main` stays green and deployable to Vercel.

## Accessibility (decision #24)

- Semantic HTML, real buttons/links/nav/headings. `aria-label`/`aria-pressed` on interactive controls. Visible `focus-visible` states. Keyboard-operable builder canvas (tab + Enter/Space; arrows for quantities). Labeled inputs with `aria-invalid`/`aria-describedby`.

## Never-do list

- Do NOT add the Tailwind CDN `<script>` — compiled Tailwind only.
- Do NOT add `vercel.json`, `@vercel/*` beyond the two approved packages, or a `vercel` runtime dependency — Vercel is the zero-config deploy target.
- Do NOT implement payment, auth, accounts, or a backend — out of scope (decisions #4, #5).
- Do NOT start implementation without the user's explicit go signal (currently held).
