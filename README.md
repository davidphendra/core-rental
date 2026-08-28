# Core Rental — Your Bali Office, Delivered.

Rent fully-equipped office setups — desks, chairs, monitors, plants, coffee
machines and tropical extras — to digital nomads and startups in Bali,
**month-to-month**. Design your dream workspace on a visual canvas, then rent it.

> Status: frontend demo MVP (decisions recorded in `specs/DECISION_RECORD.md`).
> No payment, no backend — the Rent flow ends in a demo confirmation.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4
· TanStack Query v5 · pnpm · Node 22 · Vitest + Playwright · Vercel.

## Commands

| Task                                   | Command                                        |
| -------------------------------------- | ---------------------------------------------- |
| Install                                | `pnpm install`                                 |
| Dev                                    | `pnpm dev` → http://localhost:3000             |
| Unit/integration                       | `pnpm test`                                    |
| Coverage (80% branch on shared/domain) | `pnpm test:coverage`                           |
| Lint / Format / Typecheck              | `pnpm lint` · `pnpm format` · `pnpm typecheck` |
| Build / E2E                            | `pnpm build` · `pnpm test:e2e`                 |
| Catalog regenerate                     | `pnpm generate:catalog`                        |
| Preflight (all gates)                  | `pnpm preflight`                               |

## Architecture

Feature-based vertical slices (`src/features/{home,builder,store,summary}`) over
shared layers (`src/shared/{data,domain,state,hooks,ui,types,config,observability}`).
See `specs/tech-architecture/tech-stack.md` for the full structure and decisions.

## Testing

- **Vitest** unit/integration, colocated beside source (80% branch gate on `shared/domain`)
- **Playwright** E2E in `e2e/` — positive flows + 11 negative flows (N1–N11),
  running against the production build (decision #35–38)
- E2E expectations import `products.json` with spec-local arithmetic — never app
  logic (decision #37)

## Deploy

**Vercel zero-config** — push to `main` and Vercel builds + deploys automatically
(detects Next.js; no `vercel.json` needed, no `vercel` package).

Local preview of a production build:

```bash
pnpm build && pnpm start   # then open http://localhost:3000
```

Optional CLI previews: `vercel dev` / `pnpm dlx vercel deploy --preview`
(dev-time tooling only — never a runtime dependency).

Security headers (CSP etc.) are served by `next.config.ts` on every route —
asserted by E2E N9.
