import {
  cheapestRentableTotal,
  validateDesign,
  type AiDesign,
} from "@/shared/domain/aiDesignSchema";
import { formatIdr } from "@/shared/domain/pricing";
import type { Product } from "@/shared/types/product";

/**
 * e10: orchestrates the AI design flow — LLM interpretation → validation →
 * retry-once → honest refusal. The LLM is injected (LlmAdapter) so tests can
 * script model behavior; the default adapter (see llm.ts) wires the Vercel AI
 * SDK. Validation, totals, and budget arithmetic never trust the LLM (S4/S7).
 */

export interface LlmRunRequest {
  prompt: string;
  /** Server-extracted budget (IDR/month) or null when none was stated. */
  budget: number | null;
  /** Retry guidance from the previous attempt (second call only). */
  feedback?: string;
}

export type LlmRunResult =
  | { kind: "design"; design: unknown }
  | { kind: "rejection"; message: string }
  | { kind: "llm_error"; message: string };

export interface LlmAdapter {
  run(request: LlmRunRequest): Promise<LlmRunResult>;
}

export type AiOutcome =
  | { kind: "design"; design: AiDesign }
  | { kind: "refusal"; message: string; cheapestTotal: number }
  | { kind: "rejection"; message: string }
  | { kind: "error"; reason: "provider_error" | "invalid_output"; message: string };

const MAX_ATTEMPTS = 2;

export async function runAiDesign(params: {
  prompt: string;
  catalog: readonly Product[];
  budget?: number | null;
  llm: LlmAdapter;
}): Promise<AiOutcome> {
  const { prompt, catalog, llm } = params;
  const budget = params.budget ?? null;
  let feedback: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await llm.run({ prompt, budget, feedback });
    if (result.kind === "llm_error") {
      return { kind: "error", reason: "provider_error", message: result.message };
    }
    if (result.kind === "rejection") {
      return { kind: "rejection", message: result.message }; // definitive gate — no retry
    }

    const validation = validateDesign(result.design, catalog, budget);
    if (validation.ok) return { kind: "design", design: validation.design };

    if (validation.overBudget) {
      if (attempt < MAX_ATTEMPTS) {
        feedback = `The design exceeds the stated budget of ${formatIdr(budget ?? 0)} per month. Pick cheaper items so the total fits.`;
        continue;
      }
      const cheapest = cheapestRentableTotal(catalog);
      return {
        kind: "refusal",
        message: `The cheapest rentable setup is ${formatIdr(cheapest)} per month — no valid design fits the stated budget. Try a higher budget, or apply the cheapest option manually.`,
        cheapestTotal: cheapest,
      };
    }

    if (attempt < MAX_ATTEMPTS) {
      feedback = `Invalid design: ${validation.errors.join("; ")}. Only use products returned by searchCatalog, place each in its correct slot, and respect the builder caps.`;
      continue;
    }
    return { kind: "error", reason: "invalid_output", message: validation.errors.join("; ") };
  }

  return { kind: "error", reason: "invalid_output", message: "design could not be finalized" };
}
