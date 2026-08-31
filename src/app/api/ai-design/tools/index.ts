import { jsonSchema, tool } from "ai";

import { searchCatalog, searchParamsSchema } from "./search";

/**
 * llama.cpp-safe schemas for the terminal tools (S2 wire compat; see
 * tools/search.ts for the retriever schema). Steer the model only — strict
 * validation happens server-side in validateDesign.
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
 * The agent's tool registry: searchCatalog (discovery, decision 3),
 * finalizeDesign (submit), rejectQuery (off-topic gate). The orchestrator
 * still re-validates everything server-side (never trust the LLM, S4/S7).
 */
export function createDesignTools(origin: string) {
  return {
    searchCatalog: tool({
      description:
        "Search the rental catalog by category (chair|desk|accessory) and/or subCategory (monitor|lamp|plant|coffee|beanbag — implies accessory). Every call returns candidates. Call it exactly ONCE per type (7 calls total, all in the first message) — you do the query-relevance ranking",
      inputSchema: searchParamsSchema,
      execute: (args) => searchCatalog(args, origin),
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
  };
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
