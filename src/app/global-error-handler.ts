"use client";

import { logger } from "@/shared/observability/logger";

// Global last-mile error capture (decision E4): anything the error boundaries
// can't see lands here as structured events (O2 taxonomy).

export function initGlobalErrorListeners(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    logger.error("unhandledrejection", {
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    });
  });

  window.addEventListener("error", (event: ErrorEvent) => {
    logger.error("unhandlederror", { message: event.message });
  });
}
