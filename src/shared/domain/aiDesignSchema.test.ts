import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import { validateDesign } from "./aiDesignSchema";

const p = (skuNo: string, pricePerMonth = 100_000): Product => ({
  skuNo,
  name: skuNo,
  category: "accessory",
  pricePerMonth,
  description: "d",
  image: "/x.svg",
});

const CHA = "CHAA1B2C3D4E";
const DSK = "DSKA1B2C3D4E";
const MON1 = "MONA1B2C3D4E";
const MON2 = "MONB1B2C3D4E";
const CFE = "CFEA1B2C3D4E";
const LMP = "LMPA1B2C3D4E";
const PLT = "PLTA1B2C3D4E";
const BBG = "BBGA1B2C3D4E";

const catalog: Product[] = [
  p(CHA, 500_000),
  p(DSK, 1_000_000),
  p(MON1, 400_000),
  p(MON2, 450_000),
  p(CFE, 600_000),
  p(LMP, 150_000),
  p(PLT, 120_000),
  p(BBG, 300_000),
];

const FULL = {
  chairSku: CHA,
  deskSku: DSK,
  monitorSkus: [MON1, MON2],
  coffeeSku: CFE,
  beanbagSku: BBG,
  lampSku: LMP,
  plantSku: PLT,
  totalPerMonth: 3_520_000,
};

describe("validateDesign", () => {
  it("accepts a valid full design and recomputes the total", () => {
    const r = validateDesign(FULL, catalog);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.design.totalPerMonth).toBe(3_520_000);
  });

  it("accepts a partial design with empty slots", () => {
    const r = validateDesign({ deskSku: DSK, lampSku: LMP }, catalog);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.design.chairSku).toBeNull();
      expect(r.design.monitorSkus).toEqual([]);
      expect(r.design.totalPerMonth).toBe(1_150_000);
    }
  });

  it("rejects a sku that is not in the catalog", () => {
    const r = validateDesign({ ...FULL, chairSku: "CHAABCDEFGHI" }, catalog);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toContain("not in catalog");
  });

  it("rejects a sku placed in the wrong slot", () => {
    const r = validateDesign({ ...FULL, chairSku: DSK }, catalog);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toContain("is not a CHA product");
  });

  it("rejects more than three monitors", () => {
    const r = validateDesign({ ...FULL, monitorSkus: [MON1, MON1, MON1, MON1] }, catalog);
    expect(r.ok).toBe(false);
  });

  it("rejects when the LLM-reported total mismatches the computed total", () => {
    const r = validateDesign({ ...FULL, totalPerMonth: 1 }, catalog);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toContain("total mismatch");
  });

  it("rejects over-budget designs and flags the budget breach", () => {
    const r = validateDesign(FULL, catalog, 3_000_000);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.overBudget).toBe(true);
      expect(r.errors.join(" ")).toContain("exceeds budget");
    }
  });

  it("rejects the same sku reused across different slots", () => {
    const r = validateDesign({ ...FULL, deskSku: CHA }, catalog);
    expect(r.ok).toBe(false);
  });

  it("allows the same monitor model in two slots (2A+1B semantics)", () => {
    const r = validateDesign(
      { ...FULL, monitorSkus: [MON1, MON1, MON2], totalPerMonth: 3_920_000 },
      catalog,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.design.totalPerMonth).toBe(3_920_000);
  });
});
