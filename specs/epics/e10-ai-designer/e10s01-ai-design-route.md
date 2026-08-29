# Story e10s01: AI design API route

**type:** feature
**risk:** P0
**context:** api
**maturity:** 3 (Countable)
**status:** todo
**bcps:** 8
**epic:** e10 (AI Workspace Designer)

## 1. Metadata

| Field | Value               |
| ----- | ------------------- |
| ID    | e10s01              |
| Title | AI design API route |
| Epic  | e10                 |
| Type  | feature             |
| Risk  | P0                  |

## 2. Summary

A `POST /api/ai-design` route powered by the Vercel AI SDK. The LLM interprets a
natural-language request ("fancy gaming workspace, max Rp 30 juta") and discovers
products **by calling tools** — `searchCatalog`, `getSetupTotal`, `finalizeDesign` —
so every returned SKU is a real catalog product, never hallucinated. The route
validates the final design server-side (SKU exists, slot/category matches, caps
respected) and re-verifies the monthly total against a stated budget, then returns
strict structured JSON plus a plain-language note. Provider is switchable via env
(LM Studio `localhost:1234/v1` in dev, OpenAI in prod).

## 3. Value

Turns the demo's flagship question — "can the app design my workspace?" — into a
real, reliable flow. Tool-based discovery guarantees hallucination-free SKUs;
server-side validation and budget re-verification make the output trustworthy
enough to apply directly to the builder.

## 4. Domain Language

SKU, catalog, Setup, Monthly Total, budget, builder schema (GLOSSARY_LATEST).

## 5. Scenarios

- "fancy gaming workspace, max Rp 30 juta" → a design whose monthly total ≤ 30.000.000, all SKUs real
- "just a desk and a lamp" → partial design with empty slots
- "gaming setup under Rp 5 juta" → honest refusal listing the cheapest valid alternatives
- LLM returns a bogus SKU → route rejects, auto-retries once, then returns a clear error
- No model/key configured → route disabled (503) — see e10s03

## 6. Requirements (delta)

#### ADDED: /api/ai-design (POST)

**Request:** `{ prompt: string }` (trimmed, non-empty, ≤ 500 chars — G3-style bound).

**Provider selection (env):**

- `AI_BASE_URL` set → `createOpenAICompatible({ name, apiKey: "lm-studio", baseURL: AI_BASE_URL })` (LM Studio, OpenAI-compatible protocol)
- else → `createOpenAI({ apiKey: OPENAI_API_KEY })` (OpenAI API)
- `AI_MODEL` selects the model id (dev default `gpt-oss-20b`; prod `gpt-4.1-mini`)

**Tools (zod-parameterized, per AI SDK v7):**

- `searchCatalog({ query?, category?, maxPrice? })` → matches from the live catalog (name/description/category/price) — returns `{ skuNo, name, category, pricePerMonth, description }`
- `getSetupTotal(skus: string[])` → `{ total, count }` sum of monthly prices (budget check)
- `finalizeDesign(design)` → returns the design, re-validated against the catalog + caps + budget

**Output contract (strict JSON):**

```json
{
  "chairSku": "CHR…",
  "deskSku": "DSK…",
  "monitorSkus": ["MON…", "…"],
  "coffeeSku": "CFE…",
  "beanbagSku": "BBG…",
  "lampSku": "LMP…",
  "plantSku": "PLT…",
  "totalPerMonth": 12450000,
  "note": "…"
}
```

All slots optional (partial designs valid); caps: ≤3 monitors, ≤1 each coffee/beanbag/lamp/plant.

**Server-side validation:** every SKU exists in the catalog; category matches its slot; caps respected; `totalPerMonth` equals the computed sum; budget (when stated) not exceeded. Any failure → retry once → clear 422/500 error. Impossible budget → honest-refusal response (`{ refusal: true, message, cheapestTotal }`) instead of a design.

## 7. UI/UX

None directly (API only). Consumed by e10s02.

## 8. Data Model

No changes. Reads the committed catalog (`src/shared/data/products.ts`).

## 9. API Contracts

`POST /api/ai-design` → `200 { design: DesignResult | refusal }`, `400` (bad prompt), `422` (invalid design after retry), `429` (rate limited), `503` (AI disabled), `500` (provider failure). Never returns unvalidated LLM output.

## 10. Validation Rules

Prompt bound (trim, ≤ 500 chars); design schema (zod); SKU existence; slot/category match; caps; total recomputation; budget ceiling.

## 11. Security

Prompt injection: the LLM may be told anything, but the **output is validated against the catalog schema before any state change** — a hostile prompt cannot inject arbitrary SKUs (they must exist in the catalog and fit the builder). The OpenAI key is server-side only. No user data is persisted. PII: prompt text is never logged (see e10s03).

## 12. Performance

Tool loop is small (63 products, search is O(n)); 60s timeout; non-streaming v1. Single serverless invocation per request.

## 13. Accessibility

N/A (API). e10s02 owns UI accessibility.

## 14. Observability

`ai.request {model, durationMs, toolCalls, ok}` — **without** the prompt text. `ai.design_applied {chairSku, deskSku, monitorCount, total}` (fired by the panel on apply — see e10s03 for emitter details).

## 15. Error Handling

Provider failure → 500 with friendly message; invalid design → retry once → 422; rate limit → 429; disabled → 503; impossible budget → refusal payload (not an error).

## 16. Edge Cases

- Empty/whitespace prompt → 400
- Prompt > 500 chars → 400
- LLM returns text instead of tool calls (tool-unsupported model) → route detects missing `finalizeDesign` and returns a clear error
- LLM suggests 2 chairs / 4 monitors → `finalizeDesign` rejects → retry → refusal message
- Budget below cheapest valid setup → honest refusal with `cheapestTotal`
- Timeout mid-tool-loop → 504-style error, no partial design

## 17. Acceptance Criteria

```gherkin
Scenario: Valid design from a natural-language prompt
  Given a prompt like "fancy gaming workspace, max Rp 30 juta"
  When POSTed to /api/ai-design with a mocked provider that returns tool calls
  Then a design is returned whose SKUs all exist in the catalog, fit their slots,
  and whose totalPerMonth equals the recomputed sum and is ≤ 30,000,000 when a budget was stated

Scenario: Honest refusal for impossible budgets
  Given a budget below the cheapest valid setup
  When the design is finalized
  Then a refusal payload with the cheapest valid alternatives is returned, not a design

Scenario: Hallucinated SKUs never reach the client
  Given the LLM returns a bogus SKU
  When the route validates
  Then the design is rejected (retry → clear error); no bogus SKU is ever returned

Scenario: Partial designs are valid
  Given "just a desk and a lamp"
  When finalized
  Then empty slots are allowed and the total reflects only selected items
```

## 18. Test Plan

`src/app/api/ai-design/ai-design.test.ts` — mocked provider (a fake LLM that emits scripted tool calls) covering: valid design, partial design, budget refusal, bogus-SKU rejection + retry, prompt bounds, provider failure, disabled state. Zod schema tests. Budget recomputation tests.

## 19. Dependencies

e10s03 provides the guardrail middleware (env gate, rate limit, output cap) that wraps this route; e10s02 consumes it. Deps: `ai@^7`, `@ai-sdk/openai@^4`, `zod`.

## 20. Definition of Done

`POST /api/ai-design` returns only validated designs or honest refusals/errors; every test above green with a mocked provider; no prompt text emitted; docs-cited provider pattern (ai-sdk.dev OpenAI-compatible) verified in code comments.
