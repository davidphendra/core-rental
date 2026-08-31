# REFACTOR — AI Repository Layout (`src/ai/`)

> **HARD GATE (invariant):** The `/api/ai-design` HTTP contract and runtime
> behavior are preserved EXACTLY — same tools (`searchCatalog`,
> `finalizeDesign`, `rejectQuery`), same system-prompt semantics, same
> validation/retry/refusal logic, same observability events, same env gating.
> Only file locations change. All 266 unit tests + 33 E2E stay green at every
> commit; the Next route stays at `src/app/api/ai-design/route.ts`.

## Problem Statement

The AI code is not organized: one 181-line file (`llm.ts`) mixes the system
prompt, the tool retriever, the tool definitions, the JSON schemas, and the
model adapter — several unrelated concerns in a single file. AI logic is
scattered across `app/api/ai-design/` (route, provider, guardrails, runAiDesign,
llm) and `shared/domain/` (aiDesign, aiDesignSchema), so "where does X live" has
no single answer. The user asked for a KISS layout with one concern per file and
proposed a models/agents/tools/prompts/guardrails/workflows hierarchy.

## Solution

Introduce `src/ai/` as the single home for AI-specific server infrastructure,
with the hierarchy: `models/` (provider wiring), `agents/` (the designer LLM
agent + its adapter contract), `tools/` (retriever + tool registry), `prompts/`
(system prompt + constants), `guardrails/` (input/output/safety), and
`workflows/` (the orchestrator). Only files with real content are created — no
stubs for capabilities we do not have (grill Q1=a). The route becomes a thin
shell. Client-safe shared modules (`aiDesignSchema`, `catalogFilter`) and the
client UI (`DesignWithAI`) stay where they are so the client bundle remains
clean.

## Commits

Each commit leaves the tree green. Verify command per commit:
`pnpm typecheck && pnpm test` (targeted vitest where noted).

1. **Scaffold `src/ai/models/` — move the model provider** — relocate the
   OpenAI provider factory (env wiring, classic-tools fetch middleware,
   `AiDisabledError`) and its test into `models/model-config`; update the
   route import; delete the old file.
2. **Move the rate limiter** — relocate `rateLimitAllowed`/`resetRateLimits`
   and their test into `guardrails/safety`; update the route import; delete
   the old file.
3. **Move the orchestrator** — relocate `runAiDesign` + its result types and
   test into `workflows/designer`; update the route import; delete the old
   file. (The adapter interface types stay here for now — they move in
   commit 7.)
4. **Split `llm.ts` part 1: the retriever** — relocate `searchCatalog`,
   its hit shape, its args schema, and its tests into `tools/search`; the
   adapter re-imports from there (llm.ts still exists, slimmer).
5. **Split `llm.ts` part 2: the system prompt** — relocate `systemPrompt`
   and the `WORKSPACE_REJECTION_MESSAGE` constant into `prompts/system`;
   update importers.
6. **Split `llm.ts` part 3: the tool registry** — relocate the three tool
   definitions (`searchCatalog`, `finalizeDesign`, `rejectQuery`) and their
   JSON schemas into `tools/index`; the adapter imports the registry.
7. **Create the agent** — relocate `createLlmAdapter` AND move the adapter
   contract types (`LlmAdapter`, `LlmRunRequest`, `LlmRunResult`) from
   `workflows/designer` into `agents/chat-agent` (the workflow now imports
   the contract from the agent — dependency direction reversed); update the
   workflow's imports; move the adapter tests; **delete `llm.ts`**.
8. **Input guardrail** — relocate `extractBudgetIdr` (+ its test) from
   `shared/domain/aiDesign` into `guardrails/input`; `aiDesign.ts` is then
   empty and deleted.
9. **Output guardrail facade** — add `guardrails/output` re-exporting the
   client-safe design validation + budget helpers from `shared/domain`
   (`validateDesign`, `AiDesign`, `cheapestRentableTotal`, budget type);
   the workflow imports validation through this facade.
10. **Slim the route** — rewrite the route's imports to `@/ai/…`; it keeps
    only HTTP/DI/logging/503-catch; verify `route.test.ts` unchanged and
    green.
11. **Docs & records** — update the README AI section paths, add a
    DECISION_RECORD entry, note the layout in state.yaml.

Final gate (after commit 11): `pnpm preflight` + full E2E + the client-bundle
leak check (no product data in `static/chunks`).

## Decision Document

- **New module tree:** `src/ai/` with `models/model-config`,
  `agents/chat-agent`, `tools/search`, `tools/index`, `prompts/system`,
  `guardrails/input`, `guardrails/output`, `guardrails/safety`,
  `workflows/designer` — one concern per file (KISS; no stubs).
- **The agent owns its adapter contract:** `LlmAdapter` /
  `LlmRunRequest` / `LlmRunResult` live with the agent implementation;
  the orchestrator depends on the agent interface (not vice-versa).
- **Guardrail split:** input = prompt/budget extraction; output = design
  validation facade over the client-safe schema; safety = rate limit +
  configuration gating.
- **Route stays thin:** Next.js requires `app/api/ai-design/route.ts` —
  HTTP, dependency injection, logging, and the 503 catch only.
- **Client-safe modules stay in `shared/domain`:** `aiDesignSchema`
  (AiDesign/validateDesign/MAX_DESIGN_TOTAL — the client panel imports it)
  and `catalogFilter` (shared with `/api/products` + the client hook).
  `src/ai/` is server-only; the client never imports it.
- **Naming follows the proposed template where it maps** (`chat-agent`,
  `search`, `system`, `model-config`); domain-accurate where it does not
  (`workflows/designer` — there is no "research" workflow).
- **Versioning (open, recommendation):** a pure `refactor:` commit does not
  bump semantic-release — keep `v1.14.0` (refactor ships with the next
  feature release). Alternatives: manual `v1.14.1` patch or `v1.15.0`
  minor (semantically wrong for a no-behavior-change move).

## Testing Decisions

- The refactor is behavior-neutral: the existing 266 unit tests + 33 E2E
  (incl. the gated real-LLM scenario) are the safety net — they move with
  their modules (colocated) and must stay green at every commit.
- Only import paths change; no test logic changes except the moved modules'
  import targets. The `route.test.ts` integration suite is untouched.
- The final gate adds the client-bundle leak check (product names must not
  appear in `static/chunks`) to prove the client boundary survived.

## Out of Scope

- No behavior/contract changes to `/api/ai-design` (tools, prompt, budget,
  validation, events, gating).
- No changes to the client UI (`DesignWithAI`, `SelectionPanel`), `shared/domain`
  client-safe modules, `shared/data`, `/api/products`, or the e2e suite.
- No new AI capabilities (no embeddings, research/document agents,
  calculator, document processing) — the template's empty slots stay empty.
- No dependency changes (except none required).

## Further Notes

- Branch: `refactor/ai-layout` off `main` (v1.14.0). Nothing pushed to
  origin until the user signals.
- LM Studio is currently down — the gated real-LLM E2E will skip (by
  design); it stays green via the existing passing runs.
