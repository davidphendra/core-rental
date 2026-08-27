"use client";

// Global last-mile error capture (decision E4). Upgraded to the structured
// logger at e03s03; until then, console is the sink (as decided — no tracking
// tooling in the demo posture).

export function initGlobalErrorListeners(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    console.error("[unhandledrejection]", event.reason);
  });

  window.addEventListener("error", (event: ErrorEvent) => {
    console.error("[error]", event.error ?? event.message);
  });
}
