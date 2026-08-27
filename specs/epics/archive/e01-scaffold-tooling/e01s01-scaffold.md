# Story e01s01: Project scaffold

**type:** feat
**risk:** P1
**context:** infra
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 3
**epic:** e01 (Project Scaffold & Tooling)

## 1. Metadata

| Field | Value            |
| ----- | ---------------- |
| ID    | e01s01           |
| Title | Project scaffold |
| Epic  | e01              |
| Type  | feat             |
| Risk  | P1               |

## 2. Summary

Initialize the Next.js 16 codebase with the full toolchain from decisions #12, #14, #17, #41: strict TypeScript, Tailwind v4 with tropical-tech tokens, ESLint/Prettier/husky, pnpm + Node 20. This is the foundation every other epic builds on.

## 3. Value

Nothing else can land until the scaffold compiles, lints, and type-checks cleanly. It de-risks all downstream epics by proving the toolchain early.

## 4. Domain Language

Scaffold, toolchain, tokens (see GLOSSARY_LATEST: Core Rental).

## 5. Scenarios

- Developer runs `pnpm dev` and sees the app skeleton
- Developer runs `pnpm lint` / `pnpm typecheck` / `pnpm build` — all pass
- Pre-commit hook runs lint-staged on staged files

## 6. Business Rules

Decisions #12 (strict + noUncheckedIndexedAccess + zero any), #14 (ESLint config + Prettier + prettier-plugin-tailwindcss + husky + boundary lint rules), #17 (pnpm, Node 20), #41 (Next.js 16, Turbopack), #8 (light mode only tokens).

## 7. UI/UX

No UI in this story — the bare app shell only. Tropical-tech tokens are established in globals.css for later features.

## 8. Data Model

None.

## 9. API Contracts

None.

## 10. Validation Rules

N/A (no user input).

## 11. Security

Compiled Tailwind only — never the CDN script (decision #13). No secrets in client.

## 12. Performance

Turbopack build; Next.js 16 default chunking.

## 13. Accessibility

N/A at scaffold stage (applies from e04 onward per decision #24).

## 14. Observability

N/A (logger arrives in e03s03).

## 15. Error Handling

N/A.

## 16. Edge Cases

- Lockfile drift: `pnpm install --frozen-lockfile` must pass in CI
- Prettier + ESLint conflict: `prettier-plugin-tailwindcss` ordering per docs

## 17. Acceptance Criteria

```gherkin
Scenario: Toolchain passes
  Given the project is scaffolded with pnpm and Node 20
  When the developer runs pnpm typecheck, pnpm lint, and pnpm build
  Then all three commands exit 0

Scenario: Strict TypeScript is enforced
  Given tsconfig.json enables strict and noUncheckedIndexedAccess
  When a file contains an implicit any
  Then pnpm typecheck fails
```

## 18. Test Plan

Colocated unit tests arrive with domain code (e03+). This story's verification is toolchain-level: typecheck, lint, build (tasks e01s01-1..4).

## 19. Dependencies

None (greenfield). Provides the base for e01s02 and all later epics.

## 20. Definition of Done

`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm install --frozen-lockfile` all exit 0; tropical-tech tokens present in globals.css; husky pre-commit wired.
