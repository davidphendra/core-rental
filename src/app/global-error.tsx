"use client";

import { useEffect } from "react";

import { logger } from "@/shared/observability/logger";

/**
 * Global error boundary (decision #26/#28): catches root-layout failures and
 * must own its own <html>/<body> (it replaces the layout). Generic copy only —
 * the raw error is logged, never rendered (T2).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("error.boundary", { message: error.message, digest: error.digest, global: true });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Something went wrong</h1>
        <p className="text-body-lg text-on-surface-variant">We hit a snag. Please try again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="bg-primary text-on-primary hover:bg-surface-tint focus-visible:outline-primary rounded-xl px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
