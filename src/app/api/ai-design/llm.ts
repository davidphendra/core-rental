import { generateText, tool } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";

import { aiDesignInputSchema } from "@/shared/domain/aiDesignSchema";
import type { Product } from "@/shared/types/product";

import type { LlmAdapter, LlmRunRequest, LlmRunResult } from "./runAiDesign";

/**
 * e10: default LLM adapter — wires the Vercel AI SDK (generateText + tools) to
 * the injectable LlmAdapter contract. The model discovers products through
 * searchCatalog (pure-tool discovery, decision 3), verifies totals with
 * getSetupTotal, and submits via finalizeDesign; the orchestrator still
 * re-validates everything server-side (never trust the LLM, S4/S7).
 */

/** sku-prefix lookup for the searchable product types. */
const TYPE_PREFIX: Record<string, string> = {
  chair: "CHA",
  desk: "DSK",
  monitor: "MON",
  lamp: "LMP",
  plant: "PLT",
  coffee: "CFE",
  beanbag: "BBG",
};

const searchParams = z.object({
  query: z.string().optional().describe("Free-text match against product name/description"),
  type: z
    .enum(["chair", "desk", "monitor", "lamp", "plant", "coffee", "beanbag"])
    .optional()
    .describe("Product type to narrow the search"),
  maxPrice: z.number().int().positive().optional().describe("Monthly price ceiling in IDR"),
});

const totalParams = z.object({
  skus: z.array(z.string()).describe("SKUs to sum (monthly IDR)"),
});

export interface CatalogHit {
  skuNo: string;
  name: string;
  pricePerMonth: number;
  description: string;
}

/** Pure search over the committed catalog (max 8 hits). */
export function searchCatalog(
  args: z.infer<typeof searchParams>,
  catalog: readonly Product[],
): CatalogHit[] {
  const query = args.query?.trim().toLowerCase();
  const prefix = args.type ? TYPE_PREFIX[args.type] : undefined;
  const hits = catalog.filter((p) => {
    if (prefix && !p.skuNo.startsWith(prefix)) return false;
    if (args.maxPrice != null && p.pricePerMonth > args.maxPrice) return false;
    if (query && !(p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)))
      return false;
    return true;
  });
  return hits.slice(0, 8).map((p) => ({
    skuNo: p.skuNo,
    name: p.name,
    pricePerMonth: p.pricePerMonth,
    description: p.description,
  }));
}

/** Pure sum of monthly prices for a set of skus (found ones only). */
export function getSetupTotal(skus: string[], catalog: readonly Product[]): { total: number; count: number } {
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

function systemPrompt(catalog: readonly Product[], budget: number | null, feedback?: string): string {
  const caps =
    "The builder holds exactly ONE chair, ONE desk, up to THREE monitors, and at most one each of coffee, beanbag, lamp, plant. Empty slots are allowed.";
  const workflow =
    "Interpret the user's request, then call searchCatalog (per type) to find real products. Use getSetupTotal to check totals. Finally call finalizeDesign with the exact design schema. Never invent SKUs — only use what searchCatalog returned.";
  const note =
    "Best-fit + explain: if the request cannot fit the builder (e.g. 2 chairs, 4 monitors), adapt within the caps and explain in the note field what you did.";
  const budgetLine = budget != null ? `A budget of Rp ${budget.toLocaleString("id-ID")} per month is stated — the total must fit it.` : "";
  const feedbackLine = feedback ? `Previous attempt failed: ${feedback}` : "";
  return [
    "You are the workspace designer for a Bali office-equipment rental service.",
    `The catalog has ${catalog.length} products.`,
    caps,
    workflow,
    note,
    budgetLine,
    feedbackLine,
    "Respond in the note field in plain language (max ~300 chars).",
  ]
    .filter(Boolean)
    .join(" ");
}

export function createLlmAdapter(model: LanguageModel, catalog: readonly Product[]): LlmAdapter {
  return {
    async run(request: LlmRunRequest): Promise<LlmRunResult> {
      const result = await generateText({
        model,
        maxOutputTokens: 1000,
        maxRetries: 1,
        system: systemPrompt(catalog, request.budget, request.feedback),
        prompt: request.prompt,
        tools: {
          searchCatalog: tool({
            description: "Search the rental catalog for products matching a query and/or type",
            inputSchema: searchParams,
            execute: (args) => searchCatalog(args, catalog),
          }),
          getSetupTotal: tool({
            description: "Compute the total monthly price of a set of SKUs",
            inputSchema: totalParams,
            execute: ({ skus }) => getSetupTotal(skus, catalog),
          }),
          finalizeDesign: tool({
            description:
              "Submit the final design. chairSku/deskSku each one; monitorSkus up to 3; coffeeSku/beanbagSku/lampSku/plantSku at most one each; include the computed totalPerMonth",
            inputSchema: aiDesignInputSchema,
            execute: () => ({ accepted: true }),
          }),
        },
      });

      const finalized = result.toolResults?.find((r) => r.toolName === "finalizeDesign");
      if (finalized && "args" in finalized) {
        return { kind: "design", design: (finalized as { args: unknown }).args };
      }
      return { kind: "llm_error", message: "The model did not finalize a design. Try rewording your request." };
    },
  };
}
