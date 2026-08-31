import { generateText, hasToolCall, jsonSchema, tool } from "ai";
import type { LanguageModel } from "ai";

import { WORKSPACE_REJECTION_MESSAGE, systemPrompt } from "@/ai/prompts/system";
import { searchCatalog, searchParamsSchema, type SearchCatalogArgs } from "@/ai/tools/search";
import { matchesCategoryFilter } from "@/shared/domain/catalogFilter";
import type { Product, ProductSubCategory } from "@/shared/types/product";

import type { LlmAdapter, LlmRunRequest, LlmRunResult } from "@/ai/workflows/designer";

/**
 * llama.cpp-safe schemas for the terminal tools (see tools/search.ts for the
 * retriever schema). Steer the model only — strict validation is server-side.
 */
const designSchema = jsonSchema<Record<string, unknown>>({
  type: "object",
  properties: {
    chairSku: { type: "string" },
    deskSku: { type: "string" },
    monitorSkus: { type: "array", items: { type: "string" } },
    coffeeSku: { type: "string" },
    beanbagSku: { type: "string" },
    lampSku: { type: "string" },
    plantSku: { type: "string" },
    totalPerMonth: { type: "number" },
    note: { type: "string", maxLength: 120 },
  },
});

const rejectParamsSchema = jsonSchema<Record<string, never>>({ type: "object" });

/**
 * e10: default LLM adapter — wires the Vercel AI SDK (generateText + tools) to
 * the injectable LlmAdapter contract. The model discovers products through
 * searchCatalog (pure-tool discovery, decision 3) and submits via
 * finalizeDesign; the orchestrator still re-validates everything server-side
 * (never trust the LLM, S4/S7) — totals are recomputed from real prices, so
 * no getSetupTotal roundtrip is needed (removed for speed).
 */

/**
 * llama.cpp-safe tool schemas (S2 wire compat): LM Studio's schema parser
 * rejects zod's generated keywords ($schema, additionalProperties, pattern,
 * maxItems, anyOf). These minimal JSON schemas only steer the model — strict
 * validation happens server-side in validateDesign.
 */
export type ResolvedToolOutcome =
  { kind: "rejection" } | { kind: "design"; design: unknown } | { kind: "none" };

/**
 * Which terminal tool did the model call? rejectQuery wins (the gate is
 * definitive), then finalizeDesign. Extracted pure for testability.
 */
export function resolveToolOutcome(
  toolResults: Array<{ toolName: string; args?: unknown; input?: unknown }>,
): ResolvedToolOutcome {
  if (toolResults.some((r) => r.toolName === "rejectQuery")) return { kind: "rejection" };
  const finalized = toolResults.find((r) => r.toolName === "finalizeDesign");
  if (finalized && ("input" in finalized || "args" in finalized)) {
    // v7 ToolResult exposes the tool arguments as `input` (older SDKs: `args`).
    const design =
      (finalized as { input?: unknown }).input ?? (finalized as { args?: unknown }).args;
    return { kind: "design", design };
  }
  return { kind: "none" };
}

export function createLlmAdapter(model: LanguageModel, catalog: readonly Product[]): LlmAdapter {
  return {
    async run(request: LlmRunRequest): Promise<LlmRunResult> {
      const result = await generateText({
        model,
        maxOutputTokens: 6000,
        maxRetries: 1,
        // v7: the default stopWhen is isStepCount(1) — one roundtrip. Loop until
        // the model calls a terminal tool (finalizeDesign/rejectQuery), bounded
        // by an 8-step cap so a stuck model cannot churn for minutes.
        stopWhen: [hasToolCall("finalizeDesign", "rejectQuery"), ({ steps }) => steps.length >= 8],
        system: systemPrompt(catalog, request.budget, request.feedback),
        prompt: request.prompt,
        tools: {
          searchCatalog: tool({
            description:
              "Search the rental catalog by category (chair|desk|accessory) and/or subCategory (monitor|lamp|plant|coffee|beanbag — implies accessory). Every call returns candidates. Call it exactly ONCE per type (7 calls total, all in the first message) — you do the query-relevance ranking",
            inputSchema: searchParamsSchema,
            execute: (args) => searchCatalog(args, catalog),
          }),
          finalizeDesign: tool({
            description:
              "Submit the final design. chairSku/deskSku each one; monitorSkus up to 3; coffeeSku/beanbagSku/lampSku/plantSku at most one each; include the computed totalPerMonth",
            inputSchema: designSchema,
            execute: () => ({ accepted: true }),
          }),
          rejectQuery: tool({
            description:
              "Call this when the user's query is NOT about designing or building a workspace. The request is rejected with a standardized message — no arguments needed",
            inputSchema: rejectParamsSchema,
            execute: () => ({ rejected: true }),
          }),
        },
      });

      const resolved = resolveToolOutcome(result.toolResults ?? []);
      switch (resolved.kind) {
        case "rejection":
          return { kind: "rejection", message: WORKSPACE_REJECTION_MESSAGE };
        case "design":
          return { kind: "design", design: resolved.design };
        default:
          return {
            kind: "llm_error",
            message: "The model did not finalize a design. Try rewording your request.",
          };
      }
    },
  };
}
