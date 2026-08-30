import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * e10: provider factory — env-switchable LLM backend (decision 1).
 * - AI_BASE_URL set → LM Studio / any OpenAI-compatible endpoint
 *   (http://localhost:1234/v1 in dev; officially supported per ai-sdk.dev)
 * - else → OpenAI API, key from OPENAI_API_KEY (server-side only, S3)
 * AI_MODEL selects the model id. Missing config → AiDisabledError (503 gate).
 */

export class AiDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiDisabledError";
  }
}

export function createAiModel(env: Record<string, string | undefined> = process.env): LanguageModel {
  const modelName = env.AI_MODEL?.trim();
  if (!modelName) throw new AiDisabledError("AI_MODEL is not configured");

  const baseUrl = env.AI_BASE_URL?.trim();
  if (baseUrl) {
    // LM Studio / OpenAI-compatible endpoint — any non-empty key is accepted.
    return createOpenAI({ apiKey: env.AI_API_KEY ?? "lm-studio", baseURL: baseUrl })(modelName);
  }

  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiDisabledError("OPENAI_API_KEY is not configured (or set AI_BASE_URL for LM Studio)");
  return createOpenAI({ apiKey })(modelName);
}
