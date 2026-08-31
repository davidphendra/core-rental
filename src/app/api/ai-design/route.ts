import type { LanguageModel } from "ai";

import { getCatalog } from "@/shared/data/catalog.server";
import { extractBudgetIdr } from "@/shared/domain/aiDesign";
import { logger } from "@/shared/observability/logger";
import type { Product } from "@/shared/types/product";

import { rateLimitAllowed } from "@/ai/guardrails/safety";
import { createLlmAdapter } from "./llm";
import { AiDisabledError, createAiModel } from "@/ai/models/model-config";
import { runAiDesign, type LlmAdapter } from "@/ai/workflows/designer";

/**
 * e10: POST /api/ai-design — the public AI design endpoint.
 * Wired via dependency-injected factory so tests can script the LLM and
 * guardrails without network access. Defaults: real provider (env-gated,
 * 503), in-memory rate limit (429), committed catalog.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT_CHARS = 500;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export interface AiDesignHandlerDeps {
  llm?: LlmAdapter;
  catalog?: readonly Product[];
  createModel?: () => LanguageModel;
  allowRequest?: (ip: string) => boolean;
}

export function createAiDesignHandler(deps: AiDesignHandlerDeps = {}) {
  const catalog: readonly Product[] = deps.catalog ?? getCatalog();
  const createModel = deps.createModel ?? createAiModel;
  const allowRequest = deps.allowRequest ?? rateLimitAllowed;

  return async function POST(request: Request): Promise<Response> {
    // Env gate (e10s03-1): provider must be configured — skipped when a mock
    // LLM is injected (tests), where the model is irrelevant.
    let model: LanguageModel | undefined;
    if (!deps.llm) {
      try {
        model = createModel();
      } catch (error) {
        if (error instanceof AiDisabledError) return json({ error: "ai_disabled" }, 503);
        throw error;
      }
    }

    // Best-effort rate limit (e10s03-2).
    if (!allowRequest(clientIp(request))) return json({ error: "rate_limited" }, 429);

    // Prompt contract: JSON body, string prompt, trim, length bound.
    let prompt: string;
    try {
      const body = (await request.json()) as { prompt?: unknown };
      prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (!prompt) return json({ error: "prompt_required" }, 400);
    if (prompt.length > MAX_PROMPT_CHARS) return json({ error: "prompt_too_long" }, 400);

    const budget = extractBudgetIdr(prompt);
    const llm = deps.llm ?? createLlmAdapter(model as LanguageModel, catalog);

    // Observability (e10s03-4): ai.request with facts only — never the prompt.
    let toolCalls = 0;
    const countingLlm: LlmAdapter = {
      run: async (request) => {
        toolCalls += 1;
        return llm.run(request);
      },
    };
    const startedAt = Date.now();
    const outcome = await runAiDesign({ prompt, catalog, budget, llm: countingLlm });
    logger.info("ai.request", {
      model: deps.llm ? "mock" : ((model as { modelId?: string }).modelId ?? "unknown"),
      durationMs: Date.now() - startedAt,
      toolCalls,
      ok: outcome.kind !== "error",
    });

    switch (outcome.kind) {
      case "design":
        return json({ design: outcome.design });
      case "refusal":
        return json({
          refusal: { message: outcome.message, cheapestTotal: outcome.cheapestTotal },
        });
      case "rejection":
        return json({ rejection: { message: outcome.message } });
      case "error":
        return json(
          { error: outcome.reason, message: outcome.message },
          outcome.reason === "provider_error" ? 500 : 422,
        );
    }
  };
}

export const POST = createAiDesignHandler();
