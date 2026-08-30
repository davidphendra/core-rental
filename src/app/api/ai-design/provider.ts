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

/**
 * LM Studio's llama.cpp server only understands the CLASSIC OpenAI tool
 * format (`{type:"function", function:{name,description,parameters}}`),
 * while the AI SDK v7 `openai` provider emits the newer flat format
 * (`{type:"function", name:…}`) for structured outputs. Verified against
 * llama.cpp 9770: flat tools → "Failed to parse tools"; classic → OK.
 * Converts the tools array; anything non-array (or already classic) is
 * passed through untouched.
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
 * format for custom OpenAI-compatible base URLs (LM Studio). Never touches
 * non-chat requests or already-classic bodies; parse failures pass through. */
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

  const baseUrl = env.AI_BASE_URL?.trim();
  if (baseUrl) {
    // LM Studio / OpenAI-compatible endpoint — any non-empty key is accepted.
    // .chat() selects the Chat Completions API: llama.cpp only speaks
    // /v1/chat/completions (the default provider model uses the Responses
    // API, which llama.cpp rejects). The fetch middleware rewrites the flat
    // v7 tool format into the classic nested one llama.cpp can parse.
    return createOpenAI({
      apiKey: env.AI_API_KEY ?? "lm-studio",
      baseURL: baseUrl,
      fetch: classicToolsFetch(globalThis.fetch),
    }).chat(modelName);
  }

  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey)
    throw new AiDisabledError(
      "OPENAI_API_KEY is not configured (or set AI_BASE_URL for LM Studio)",
    );
  return createOpenAI({ apiKey })(modelName);
}
