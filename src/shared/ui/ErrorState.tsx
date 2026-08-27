"use client";

import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Friendly error surface for query failures (D4, E2E N8). The message is
 * curated copy — raw errors are never rendered (decisions #13, #28).
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-outline-variant bg-surface-container-lowest flex flex-col items-center gap-4 rounded-2xl border p-8 text-center"
    >
      <p className="text-body-lg text-on-surface">{message}</p>
      {onRetry !== undefined ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
