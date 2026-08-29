/**
 * e10: demo-lite guardrails for the public AI route (decision 7).
 * In-memory sliding-window rate limit — honest limitation: per serverless
 * instance, not bulletproof against distributed floods; sufficient to stop
 * casual abuse on a demo. Output caps live in llm.ts (maxTokens) and the
 * design validator (budget/sanity checks).
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 10;

/** Client IP → timestamps of recent requests (per instance). */
const windows = new Map<string, number[]>();

/**
 * Whether a request from `ip` is allowed. Enforces ~MAX_REQUESTS per
 * WINDOW_MS per IP, pruning stale entries. Not exported state — tests can
 * reset via {@link resetRateLimits}.
 */
export function rateLimitAllowed(ip: string): boolean {
  const now = Date.now();
  const timestamps = (windows.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    windows.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  windows.set(ip, timestamps);
  return true;
}

/** Test hook: clear all rate-limit state. */
export function resetRateLimits(): void {
  windows.clear();
}
