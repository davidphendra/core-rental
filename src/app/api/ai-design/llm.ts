import { generateText, hasToolCall, jsonSchema, tool } from "ai";
import type { LanguageModel } from "ai";

import { WORKSPACE_REJECTION_MESSAGE } from "@/shared/domain/aiDesign";
import type { Product, ProductSubCategory } from "@/shared/types/product";

import type { LlmAdapter, LlmRunRequest, LlmRunResult } from "./runAiDesign";

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
const searchParamsSchema = jsonSchema<SearchCatalogArgs>({
  type: "object",
  properties: {
    category: { type: "string", enum: ["chair", "desk", "accessory"] },
    subCategory: { type: "string", enum: ["monitor", "lamp", "plant", "coffee", "beanbag"] },
  },
});

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

export interface SearchCatalogArgs {
  /** Coarse category: chair | desk | accessory. */
  category?: "chair" | "desk" | "accessory";
  /** Fine type for accessories (subCategory implies accessory). */
  subCategory?: ProductSubCategory;
}

export interface CatalogHit {
  skuNo: string;
  name: string;
  pricePerMonth: number;
  description: string;
}

/**
 * Pure category/subCategory retriever (user ruling: the query filter was
 * useless — the LLM does all semantic matching/ranking). Every valid combo is
 * guaranteed non-empty (each type has 6–10 products; subCategory implies
 * accessory by construction). Lean payload: ≤8 hits, 60-char descriptions, so
 * model roundtrips stay fast. Invalid enums match nothing → empty, never a
 * crash.
 */
export function searchCatalog(args: SearchCatalogArgs, catalog: readonly Product[]): CatalogHit[] {
  const hits = catalog.filter((p) => {
    if (args.category !== undefined && p.category !== args.category) return false;
    if (args.subCategory !== undefined && p.subCategory !== args.subCategory) return false;
    return true;
  });
  return hits.slice(0, 8).map((p) => ({
    skuNo: p.skuNo,
    name: p.name,
    pricePerMonth: p.pricePerMonth,
    description: p.description.length > 60 ? `${p.description.slice(0, 57)}…` : p.description,
  }));
}

function systemPrompt(
  catalog: readonly Product[],
  budget: number | null,
  feedback?: string,
): string {
  const budgetLine =
    budget != null
      ? `A budget of Rp ${budget.toLocaleString("id-ID")} per month is stated — every combination must fit it.`
      : "";
  const feedbackLine = feedback ? `Previous attempt failed: ${feedback}` : "";
  return [
    "You are the workspace designer for Core Rental, a Bali office-equipment rental service.",
    `The catalog has ${catalog.length} products across these types: desk, chair, monitor, lamp, plant, bean bag, coffee machine.`,
    "GATE: Only call rejectQuery for topics completely unrelated to workspaces or office furniture (e.g. weather, cooking, coding, travel). For anything about a workspace, office, desk, chair, study, gaming, or coffee setup — even vague ones — proceed with the workflow.",
    "WORKFLOW:",
    "1. In your FIRST message, call searchCatalog EXACTLY 7 times — once per type, IN PARALLEL: desk (category='desk'), chair (category='chair'), monitor/lamp/plant/coffee/beanbag (category='accessory' + subCategory). Every call returns candidates. That is the ONLY searchCatalog batch — do NOT call searchCatalog again for any reason.",
    "2. Rank the candidates by how well they match the user's query and keep the top 2 per type (at least 14 candidate products in total).",
    "3. Build the top 3 combinations that best match the query. Each combination: exactly ONE desk and ONE chair, up to THREE monitors, and at most ONE each of lamp, plant, coffee machine, bean bag. Empty accessory slots are allowed.",
    "4. Randomly pick ONE of the three combinations and submit it via finalizeDesign — include chairSku, deskSku, monitorSkus, the accessory skus, totalPerMonth (the server recomputes it), and a short plain-language note (max ~120 chars) explaining the pick.",
    "Do NOT write any text before or between tool calls — respond with tool calls ONLY. All explanation belongs in the finalizeDesign note.",
    "CAPS: 1 desk, 1 chair, up to 3 monitors, at most 1 each of lamp/plant/coffee/bean bag. Never invent SKUs — only use products returned by searchCatalog.",
    budgetLine,
    feedbackLine,
    "Respond in the note field in plain language (max ~300 chars).",
  ]
    .filter(Boolean)
    .join(" ");
}

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
