// Next.js App Router serves Route Handlers only from the app directory — this
// file is the forwarding stub; all AI logic lives in src/ai/. Route segment
// config must be declared here (Next forbids re-exporting runtime/dynamic).
import { createAiDesignHandler } from "@/features/builder/ai/route/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createAiDesignHandler();
