/**
 * e10: input guardrail — deterministic server-side budget extraction from the
 * prompt. The budget is ground truth from the prompt, never the LLM's reading
 * of it (S7 in THREAT_MODEL e10).
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
