import { generateText, hasToolCall, jsonSchema, tool } from "ai";
import type { LanguageModel } from "ai";

import { WORKSPACE_REJECTION_MESSAGE } from "@/shared/domain/aiDesign";
import type { Product, ProductSubCategory } from "@/shared/types/product";

import type { LlmAdapter, LlmRunRequest, LlmRunResult } from "./runAiDesign";

/**
 * e10: default LLM adapter — wires the Vercel AI SDK (generateText + tools) to
 * the injectable LlmAdapter contract. The model discovers products through
 * searchCatalog (pure-tool discovery, decision 3), verifies totals with
 * getSetupTotal, and submits via finalizeDesign; the orchestrator still
 * re-validates everything server-side (never trust the LLM, S4/S7).
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
    query: { type: "string" },
    category: { type: "string", enum: ["chair", "desk", "accessory"] },
    subCategory: { type: "string", enum: ["monitor", "lamp", "plant", "coffee", "beanbag"] },
    maxPrice: { type: "number" },
  },
});

const totalParamsSchema = jsonSchema<{ skus: string[] }>({
  type: "object",
  properties: {
    skus: { type: "array", items: { type: "string" } },
  },
  required: ["skus"],
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
    note: { type: "string" },
  },
});

const rejectParamsSchema = jsonSchema<Record<string, never>>({ type: "object" });

export interface SearchCatalogArgs {
  query?: string;
  /** Coarse category: chair | desk | accessory. */
  category?: "chair" | "desk" | "accessory";
  /** Fine type for accessories (subCategory implies accessory). */
  subCategory?: ProductSubCategory;
  maxPrice?: number;
}

export interface CatalogHit {
  skuNo: string;
  name: string;
  pricePerMonth: number;
  description: string;
}

/**
 * Pure search over the committed catalog — a RETRIEVER: returns ALL matches
 * (no top-5 slice). Ranking to the top 5 per type is the LLM's job (user
 * ruling). subCategory implies accessory by construction (non-accessories have
 * subCategory null). Invalid enums match nothing → empty result, never a crash.
 */
export function searchCatalog(args: SearchCatalogArgs, catalog: readonly Product[]): CatalogHit[] {
  const query = args.query?.trim().toLowerCase();
  const hits = catalog.filter((p) => {
    if (args.category !== undefined && p.category !== args.category) return false;
    if (args.subCategory !== undefined && p.subCategory !== args.subCategory) return false;
    if (args.maxPrice != null && p.pricePerMonth > args.maxPrice) return false;
    if (
      query &&
      !(p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
    )
      return false;
    return true;
  });
  return hits.map((p) => ({
    skuNo: p.skuNo,
    name: p.name,
    pricePerMonth: p.pricePerMonth,
    description: p.description.length > 120 ? `${p.description.slice(0, 117)}…` : p.description,
  }));
}

/** Pure sum of monthly prices for a set of skus (found ones only). */
export function getSetupTotal(
  skus: string[],
  catalog: readonly Product[],
): { total: number; count: number } {
  const bySku = new Map(catalog.map((p) => [p.skuNo, p.pricePerMonth]));
  let total = 0;
  let count = 0;
  for (const sku of skus) {
    const price = bySku.get(sku);
    if (price != null) {
      total += price;
      count += 1;
    }
  }
  return { total, count };
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
    "1. For EACH product type — desk, chair, monitor, lamp, plant, bean bag, coffee machine — call searchCatalog with the matching filters and the user's query: desk → category='desk'; chair → category='chair'; monitor/lamp/plant/coffee/beanbag → category='accessory' + subCategory. searchCatalog returns ALL candidates — YOU rank them by how well they match the user's query and keep the top 5 per type (at least 35 candidate products in total).",
    "2. Build the top 3 combinations that best match the query. Each combination: exactly ONE desk and ONE chair, up to THREE monitors, and at most ONE each of lamp, plant, coffee machine, bean bag. Empty accessory slots are allowed.",
    "3. Randomly pick ONE of the three combinations and submit it via finalizeDesign, with totalPerMonth computed via getSetupTotal and a short plain-language note explaining the pick.",
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
  toolResults: Array<{ toolName: string; args?: unknown }>,
): ResolvedToolOutcome {
  if (toolResults.some((r) => r.toolName === "rejectQuery")) return { kind: "rejection" };
  const finalized = toolResults.find((r) => r.toolName === "finalizeDesign");
  if (finalized && "args" in finalized) {
    return { kind: "design", design: (finalized as { args: unknown }).args };
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
              "Search the rental catalog. Filters: category (chair|desk|accessory), subCategory (monitor|lamp|plant|coffee|beanbag — implies accessory), maxPrice, query. Returns ALL matching products — you must rank them and keep the top 5 per type",
            inputSchema: searchParamsSchema,
            execute: (args) => searchCatalog(args, catalog),
          }),
          getSetupTotal: tool({
            description: "Compute the total monthly price of a set of SKUs",
            inputSchema: totalParamsSchema,
            execute: ({ skus }) => getSetupTotal(skus, catalog),
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
