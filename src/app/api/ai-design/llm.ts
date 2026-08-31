import { generateText, hasToolCall } from "ai";
import type { LanguageModel } from "ai";

import { WORKSPACE_REJECTION_MESSAGE, systemPrompt } from "@/ai/prompts/system";
import { createDesignTools, resolveToolOutcome } from "@/ai/tools";
import type { Product } from "@/shared/types/product";

import type { LlmAdapter, LlmRunRequest, LlmRunResult } from "@/ai/workflows/designer";

/**
 * e10: default LLM adapter — wires the Vercel AI SDK (generateText + the tool
 * registry) to the injectable LlmAdapter contract. The model discovers
 * products through searchCatalog and submits via finalizeDesign; the
 * orchestrator still re-validates everything server-side (never trust the
 * LLM, S4/S7) — totals are recomputed from real prices, so no getSetupTotal
 * roundtrip is needed (removed for speed).
 */
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
        tools: createDesignTools(catalog),
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
