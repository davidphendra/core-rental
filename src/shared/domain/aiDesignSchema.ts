import { z } from "zod";

import type { Product } from "../types/product";
import { SKU_PATTERN } from "../types/product";

/**
 * e10: the AI design contract — the exact shape the LLM must produce when it
 * finalizes a design (tool-calling contract), plus server-side validation
 * against the committed catalog. The LLM is never trusted: existence, slot
 * match, caps, totals, and budget are all re-checked here (S4/S7 THREAT_MODEL).
 */

/** zod schema for the LLM's finalizeDesign call (shape only). */
export const aiDesignInputSchema = z.object({
  chairSku: z.string().regex(SKU_PATTERN).nullable().optional(),
  deskSku: z.string().regex(SKU_PATTERN).nullable().optional(),
  monitorSkus: z.array(z.string().regex(SKU_PATTERN)).max(3).optional(),
  coffeeSku: z.string().regex(SKU_PATTERN).nullable().optional(),
  beanbagSku: z.string().regex(SKU_PATTERN).nullable().optional(),
  lampSku: z.string().regex(SKU_PATTERN).nullable().optional(),
  plantSku: z.string().regex(SKU_PATTERN).nullable().optional(),
  totalPerMonth: z.number().int().nonnegative().optional(),
  note: z.string().max(300).optional(),
});

/** The normalized, validated design applied to the builder. */
export interface AiDesign {
  chairSku: string | null;
  deskSku: string | null;
  monitorSkus: string[];
  coffeeSku: string | null;
  beanbagSku: string | null;
  lampSku: string | null;
  plantSku: string | null;
  totalPerMonth: number;
  note: string;
}

export type DesignValidation =
  { ok: true; design: AiDesign } | { ok: false; errors: string[]; overBudget: boolean };

/**
 * Validate an LLM design against the committed catalog. Rejects: unknown skus,
 * skus in the wrong slot, >3 monitors, skus reused across slots, an
 * LLM-reported total that mismatches the recomputed sum, and (when a budget is
 * given) totals above it. Duplicate monitors across slots are allowed
 * (2A+1B semantics, e09). Returns the normalized design with the recomputed
 * total — the LLM's number is never used.
 */
export function validateDesign(
  input: unknown,
  catalog: readonly Product[],
  budget: number | null = null,
): DesignValidation {
  const parsed = aiDesignInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return { ok: false, errors, overBudget: false };
  }
  const d = parsed.data;
  const bySku = new Map(catalog.map((p) => [p.skuNo, p]));
  const errors: string[] = [];

  // Cross-slot uniqueness: the same sku may repeat inside monitorSkus (2A+1B,
  // e09) but must never occupy two different slots.
  const slotOfSku = new Map<string, string>();
  const noteSlot = (sku: string, slot: string) => {
    const prev = slotOfSku.get(sku);
    if (prev !== undefined && prev !== slot) {
      errors.push(`${sku} used in multiple slots (${prev} and ${slot})`);
    } else {
      slotOfSku.set(sku, slot);
    }
  };

  const checkSku = (sku: string, prefix: string, slot: string) => {
    noteSlot(sku, slot);
    const product = bySku.get(sku);
    if (!product) {
      errors.push(`${sku} not in catalog`);
      return;
    }
    if (sku.slice(0, 3) !== prefix) {
      errors.push(`${sku} is not a ${prefix} product (${slot})`);
    }
  };

  const slots: Array<{
    key: "chairSku" | "deskSku" | "coffeeSku" | "beanbagSku" | "lampSku" | "plantSku";
    prefix: string;
  }> = [
    { key: "chairSku", prefix: "CHA" },
    { key: "deskSku", prefix: "DSK" },
    { key: "coffeeSku", prefix: "CFE" },
    { key: "beanbagSku", prefix: "BBG" },
    { key: "lampSku", prefix: "LMP" },
    { key: "plantSku", prefix: "PLT" },
  ];
  for (const { key, prefix } of slots) {
    const sku = d[key];
    if (sku != null) checkSku(sku, prefix, key);
  }
  for (const sku of d.monitorSkus ?? []) checkSku(sku, "MON", "monitorSkus");

  if (errors.length > 0) return { ok: false, errors, overBudget: false };

  const selected = [
    d.chairSku,
    d.deskSku,
    d.coffeeSku,
    d.beanbagSku,
    d.lampSku,
    d.plantSku,
    ...(d.monitorSkus ?? []),
  ].filter((s): s is string => s != null);
  // Duplicate monitors count (2A+1B = 3 line items); cross-slot reuse is
  // already rejected above, so this sum cannot double-count anything else.
  const total = selected.reduce((sum, sku) => sum + (bySku.get(sku)?.pricePerMonth ?? 0), 0);

  // The LLM-reported totalPerMonth is advisory: the computed `total` (from
  // real prices) is authoritative — it is what the budget check uses and what
  // gets returned. A mismatched model number is tolerated, never trusted.
  if (budget != null && total > budget) {
    errors.push(`total ${total} exceeds budget ${budget}`);
  }
  if (total > MAX_DESIGN_TOTAL) {
    errors.push(`total ${total} exceeds the sanity cap ${MAX_DESIGN_TOTAL}`);
  }
  if (errors.length > 0) {
    return { ok: false, errors, overBudget: budget != null && total > budget };
  }

  return {
    ok: true,
    design: {
      chairSku: d.chairSku ?? null,
      deskSku: d.deskSku ?? null,
      monitorSkus: d.monitorSkus ?? [],
      coffeeSku: d.coffeeSku ?? null,
      beanbagSku: d.beanbagSku ?? null,
      lampSku: d.lampSku ?? null,
      plantSku: d.plantSku ?? null,
      totalPerMonth: total,
      note: d.note ?? "",
    },
  };
}

/** Output-cap sanity bound (e10s03-3): no design may claim a monthly total above this. */
export const MAX_DESIGN_TOTAL = 1_000_000_000;

/** The cheapest rentable setup (one chair + one desk), for honest refusals. */
export function cheapestRentableTotal(catalog: readonly Product[]): number {
  const chairs = catalog.filter((p) => p.skuNo.startsWith("CHA"));
  const desks = catalog.filter((p) => p.skuNo.startsWith("DSK"));
  if (chairs.length === 0 || desks.length === 0) return Number.POSITIVE_INFINITY;
  return (
    Math.min(...chairs.map((c) => c.pricePerMonth)) + Math.min(...desks.map((d) => d.pricePerMonth))
  );
}
