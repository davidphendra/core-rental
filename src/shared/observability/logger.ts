import { track } from "@vercel/analytics";

type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Curated event taxonomy (decision O2). Extend here, not ad hoc.
 */
export type LogEventName =
  | "rent.clicked"
  | "delivery.submitted"
  | "catalog.loaded"
  | "catalog.failed"
  | "storage.degraded"
  | "validation.rejected"
  | "error.boundary"
  | "unhandledrejection"
  | "unhandlederror"
  | "cart.updated"
  | "ai.request"
  | "ai.design_applied";

export interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * PII guard (O3, threat model M2): any field whose key matches a PII pattern
 * is stripped before emission — the logger cannot leak the delivery address or
 * similar data into queryable Vercel logs.
 */
const PII_KEY_PATTERN = /^(address|email|phone|name|location|delivery|phone_number)$/i;

function sanitize(fields: LogFields): LogFields {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => !PII_KEY_PATTERN.test(key)));
}

// Look up the sink at call time so test spies (vi.spyOn(console, ...)) intercept
// the emission — captured references at module load would bypass them.
function sinkFor(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case "error":
      return console.error;
    case "warn":
      return console.warn;
    case "info":
      return console.info;
    case "debug":
      return console.debug;
  }
}

/**
 * Q4 ruling: the dotted taxonomy normalizes to Vercel-friendly event names
 * (rent.clicked -> rent_clicked, catalog.loaded -> catalog_loaded, …).
 */
function trackEventName(event: LogEventName): string {
  return event.replaceAll(".", "_");
}

function emit(level: LogLevel, event: LogEventName, fields: LogFields = {}): void {
  const safe = sanitize(fields);
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...safe,
  });
  sinkFor(level)(line);
  // Vercel Web Analytics custom event (Q1 ruling): normalized name + the SAME
  // sanitized payload (Q3). Best-effort — analytics must never break the app.
  try {
    track(trackEventName(event), safe);
  } catch {
    // fire-and-forget: offline/ad-blocked/script-not-loaded — drop silently
  }
}

/** Structured JSON logger (decisions O1–O4). PII-free by construction + guard. */
export const logger = {
  debug: (event: LogEventName, fields?: LogFields) => emit("debug", event, fields),
  info: (event: LogEventName, fields?: LogFields) => emit("info", event, fields),
  warn: (event: LogEventName, fields?: LogFields) => emit("warn", event, fields),
  error: (event: LogEventName, fields?: LogFields) => emit("error", event, fields),
};

/** Typed helper for the only PII-adjacent event: never accepts the address itself. */
export function logDeliverySubmitted(hasAddress: boolean, addressLength: number): void {
  emit("info", "delivery.submitted", { hasAddress, addressLength });
}
