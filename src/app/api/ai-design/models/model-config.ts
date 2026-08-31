import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * e10: provider factory — env-switchable LLM backend (decision 1; v1.15.1).
 * Three backends, selected by AI_PROVIDER (or inferred when unset):
 * - openai-compatible → AI_BASE_URL (LM Studio locally, OpenRouter, any
 *   OpenAI-compatible endpoint; classic-tools middleware for llama.cpp)
 * - anthropic        → ANTHROPIC_API_KEY (native Anthropic API)
 * - openai           → OPENAI_API_KEY (native OpenAI API)
 * AI_MODEL selects the model id. Missing config → AiDisabledError (503 gate).
 */

export type AiProviderName = "openai-compatible" | "openai" | "anthropic";

const PROVIDER_NAMES: readonly AiProviderName[] = ["openai-compatible", "openai", "anthropic"];

export class AiDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiDisabledError";
  }
}

/**
 * Provider selection: explicit AI_PROVIDER wins; otherwise infer for backward
 * compatibility — AI_BASE_URL → compatible, ANTHROPIC_API_KEY → anthropic,
 * else → openai. Unknown explicit value → AiDisabledError (never a 500).
 */
export function resolveProvider(env: Record<string, string | undefined>): AiProviderName {
  const explicit = env.AI_PROVIDER?.trim();
  if (explicit !== undefined && explicit !== "") {
    if ((PROVIDER_NAMES as readonly string[]).includes(explicit)) {
      return explicit as AiProviderName;
    }
    throw new AiDisabledError(
      `Unknown AI_PROVIDER "${explicit}" — expected openai-compatible | openai | anthropic`,
    );
  }
  if (env.AI_BASE_URL?.trim()) return "openai-compatible";
  if (env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  return "openai";
}

/**
 * LM Studio's llama.cpp server only understands the CLASSIC OpenAI tool
 * format (`{type:"function", function:{name,description,parameters}}`),
 * while the AI SDK v7 `openai` provider emits the newer flat format
 * (`{type:"function", name:…}`) for structured outputs. Verified against
 * llama.cpp 9770: flat tools → "Failed to parse tools"; classic → OK.
 * Converts the tools array; anything non-array (or already classic) is
 * passed through untouched. Anthropic's native API needs no rewrite.
 */
export function toClassicToolFormat(tools: unknown): unknown {
  if (!Array.isArray(tools)) return tools;
  return tools.map((t) => {
    const tool = t as Record<string, unknown>;
    if (tool !== null && typeof tool === "object" && "name" in tool && !("function" in tool)) {
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      };
    }
    return t;
  });
}

/** Fetch middleware: rewrite /chat/completions tool arrays to the classic
 * format for custom OpenAI-compatible base URLs (LM Studio/OpenRouter).
 * Never touches non-chat requests or already-classic bodies; parse failures
 * pass through. */
function classicToolsFetch(inner: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : String(input);
    if (init?.body && typeof init.body === "string" && url.includes("/chat/completions")) {
      try {
        const body = JSON.parse(init.body) as { tools?: unknown };
        if (body.tools !== undefined) {
          body.tools = toClassicToolFormat(body.tools);
          init = { ...init, body: JSON.stringify(body) };
        }
      } catch {
        // leave the request as-is — never break the wire for a parse hiccup
      }
    }
    return inner(input as RequestInfo | URL, init as RequestInit | undefined);
  };
}

export function createAiModel(
  env: Record<string, string | undefined> = process.env,
): LanguageModel {
  const modelName = env.AI_MODEL?.trim();
  if (!modelName) throw new AiDisabledError("AI_MODEL is not configured");

  switch (resolveProvider(env)) {
    case "openai-compatible": {
      const baseUrl = env.AI_BASE_URL?.trim();
      if (!baseUrl) {
        throw new AiDisabledError(
          "AI_PROVIDER=openai-compatible requires AI_BASE_URL (e.g. LM Studio or OpenRouter)",
        );
      }
      // LM Studio / OpenRouter — any non-empty key is accepted; OpenRouter
      // keys are OpenAI-format, so OPENAI_API_KEY works as a fallback.
      // .chat() selects the Chat Completions API: llama.cpp only speaks
      // /v1/chat/completions (the default provider model uses the Responses
      // API, which llama.cpp rejects). The middleware rewrites the flat v7
      // tool format into the classic nested one llama.cpp can parse.
      return createOpenAI({
        apiKey: env.AI_API_KEY ?? env.OPENAI_API_KEY ?? "lm-studio",
        baseURL: baseUrl,
        fetch: classicToolsFetch(globalThis.fetch),
      }).chat(modelName);
    }
    case "anthropic": {
      const apiKey = env.ANTHROPIC_API_KEY?.trim();
      if (!apiKey) {
        throw new AiDisabledError("ANTHROPIC_API_KEY is not configured (AI_PROVIDER=anthropic)");
      }
      // Native Anthropic API: single endpoint, standard nested tool format —
      // no classic-tools middleware needed.
      return createAnthropic({ apiKey })(modelName);
    }
    case "openai": {
      const apiKey = env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        throw new AiDisabledError(
          "OPENAI_API_KEY is not configured (or set AI_BASE_URL for LM Studio / AI_PROVIDER=anthropic)",
        );
      }
      return createOpenAI({ apiKey })(modelName);
    }
  }
}
