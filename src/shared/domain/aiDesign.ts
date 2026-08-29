/**
 * e10: AI design domain — budget extraction and design validation for the
 * /api/ai-design route. Pure functions over the committed catalog; the LLM is
 * never trusted with totals or budget arithmetic (S7 in THREAT_MODEL e10).
 */

/**
 * Extract a stated monthly budget from a free-text prompt, or null when none
 * is stated. Deterministic server-side parse — the budget is ground truth from
 * the prompt, never the LLM's reading of it.
 *
 * Accepted forms (case-insensitive):
 * - unit-suffixed: "30 juta", "5 jt", "30 million" → digits × 1_000_000
 * - currency-prefixed absolute: "Rp 30.000.000", "IDR 30000000"
 * - dotted thousands absolute: "30.000.000" (must be ≥ 1.000.000 to avoid
 *   matching catalog prices like "750.000")
 * - bare absolute: "30000000" (7+ digits)
 */
export function extractBudgetIdr(prompt: string): number | null {
  const text = prompt.trim().toLowerCase();

  // 1. unit-suffixed: digits followed by juta / jt / million
  const unit = text.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(juta|jt|million)\b/);
  if (unit) {
    const value = Number((unit[1] ?? "").replace(/[.,]/g, ""));
    if (Number.isFinite(value) && value > 0) return value * 1_000_000;
  }

  // 2. currency-prefixed absolute: rp / idr / rupiah + number
  const prefixed = text.match(/\b(?:rp|idr|rupiah)\s*(\d{1,3}(?:[.,]\d{3})+|\d{7,})\b/);
  if (prefixed) {
    const value = Number((prefixed[1] ?? "").replace(/[.,]/g, ""));
    if (Number.isFinite(value) && value >= 1_000_000) return value;
  }

  // 3. dotted thousands absolute (no currency word) — only ≥ 1.000.000
  const dotted = text.match(/\b\d{1,3}(?:\.\d{3}){2,}\b/);
  if (dotted) {
    const value = Number((dotted[0] ?? "").replace(/\./g, ""));
    if (Number.isFinite(value) && value >= 1_000_000) return value;
  }

  // 4. bare absolute digits — only 7+ digits
  const bare = text.match(/\b\d{7,}\b/);
  if (bare) {
    const value = Number(bare[0] ?? "");
    if (Number.isFinite(value)) return value;
  }

  return null;
}
