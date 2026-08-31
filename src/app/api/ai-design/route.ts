/**
 * e10: POST /api/ai-design — the public AI design endpoint. All AI code lives
 * in this folder (models/agents/tools/prompts/guardrails/workflows/handler);
 * this file is the Next route entry — it wires the handler and declares the
 * route segment config (which Next forbids re-exporting).
 */
import { createAiDesignHandler } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createAiDesignHandler();
