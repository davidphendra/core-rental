"use client";

import Link from "next/link";
import { useEffect } from "react";

import { logger } from "@/shared/observability/logger";
import { Button } from "@/shared/ui/Button";

/**
 * Route error boundary (decision #28, T2): generic copy + Try again (reset) +
 * Back to Home. The raw error is logged structurally — never rendered.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("error.boundary", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <span
        className="material-symbols-outlined text-tertiary-container text-6xl"
        aria-hidden="true"
      >
        construction
      </span>
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Something went wrong</h1>
      <p className="text-body-lg text-on-surface-variant max-w-md">
        We hit a snag building this page. Please try again.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Link
          href="/"
          className="border-primary text-primary hover:bg-primary hover:text-on-primary focus-visible:outline-primary inline-flex items-center justify-center rounded-xl border-2 px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
