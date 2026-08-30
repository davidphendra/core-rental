import { describe, expect, it } from "vitest";

import type { Product } from "@/shared/types/product";

import catalogJson from "../../../shared/data/products.json";

import { getSetupTotal, resolveToolOutcome, searchCatalog } from "./llm";

const catalog = catalogJson as unknown as readonly Product[];

describe("searchCatalog", () => {
  it("returns ALL matches for a free-text query (the LLM ranks top 5)", () => {
    const hits = searchCatalog({ query: "gaming" }, catalog);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      const text = `${h.name} ${h.description}`.toLowerCase();
      expect(text).toContain("gaming");
    }
  });

  it("filters by category", () => {
    const chairs = searchCatalog({ category: "chair" }, catalog);
    expect(chairs.length).toBeGreaterThan(0);
    for (const h of chairs) expect(h.skuNo.startsWith("CHA")).toBe(true);
    const desks = searchCatalog({ category: "desk" }, catalog);
    expect(desks.length).toBeGreaterThan(0);
    for (const h of desks) expect(h.skuNo.startsWith("DSK")).toBe(true);
  });

  it("filters accessories by subCategory with loose pairing (no category needed)", () => {
    const monitors = searchCatalog({ subCategory: "monitor" }, catalog);
    expect(monitors.length).toBeGreaterThan(0);
    for (const h of monitors) expect(h.skuNo.startsWith("MON")).toBe(true);
  });

  it("combines category and subCategory", () => {
    const lamps = searchCatalog({ category: "accessory", subCategory: "lamp" }, catalog);
    expect(lamps.length).toBeGreaterThan(0);
    for (const h of lamps) expect(h.skuNo.startsWith("LMP")).toBe(true);
  });

  it("returns the full catalog when no filters are given", () => {
    expect(searchCatalog({}, catalog).length).toBe(catalog.length);
  });

  it("respects a maxPrice ceiling", () => {
    const hits = searchCatalog({ category: "chair", maxPrice: 500_000 }, catalog);
    for (const h of hits) expect(h.pricePerMonth).toBeLessThanOrEqual(500_000);
  });

  it("returns an empty list when nothing matches, including invalid enums", () => {
    expect(searchCatalog({ query: "zzz-nothing-matches" }, catalog)).toEqual([]);
    expect(searchCatalog({ subCategory: "sofa" as never }, catalog)).toEqual([]);
  });
});

describe("getSetupTotal", () => {
  it("sums monthly prices of found skus and reports the count", () => {
    const chair = catalog.find((p) => p.skuNo.startsWith("CHA"))!;
    const desk = catalog.find((p) => p.skuNo.startsWith("DSK"))!;
    const r = getSetupTotal([chair.skuNo, desk.skuNo, "UNKNOWN1"], catalog);
    expect(r.count).toBe(2);
    expect(r.total).toBe(chair.pricePerMonth + desk.pricePerMonth);
  });

  it("skips skus not in the catalog", () => {
    const r = getSetupTotal(["UNKNOWN1", "UNKNOWN2"], catalog);
    expect(r).toEqual({ total: 0, count: 0 });
  });
});

describe("catalog fixture sanity", () => {
  it("has products for every category and sub-category", () => {
    for (const c of ["chair", "desk", "accessory"] as const) {
      expect(searchCatalog({ category: c }, catalog).length).toBeGreaterThan(0);
    }
    for (const s of ["monitor", "lamp", "plant", "coffee", "beanbag"] as const) {
      expect(searchCatalog({ subCategory: s }, catalog).length).toBeGreaterThan(0);
    }
  });

  it("catalog entries satisfy the Product contract", () => {
    const sample = catalog[0] as Product;
    expect(typeof sample.skuNo).toBe("string");
    expect(typeof sample.pricePerMonth).toBe("number");
  });
});

describe("resolveToolOutcome", () => {
  it("resolves a rejectQuery call to a rejection", () => {
    const r = resolveToolOutcome([{ toolName: "rejectQuery", args: {} }]);
    expect(r.kind).toBe("rejection");
  });

  it("resolves a finalizeDesign call to a design (v7: args)", () => {
    const r = resolveToolOutcome([{ toolName: "finalizeDesign", args: { deskSku: "X" } }]);
    expect(r.kind).toBe("design");
    if (r.kind === "design") expect(r.design).toEqual({ deskSku: "X" });
  });

  it("resolves a finalizeDesign call to a design (v7: input — real ToolResult shape)", () => {
    const r = resolveToolOutcome([
      { toolName: "finalizeDesign", input: { deskSku: "X", totalPerMonth: 5 } },
    ]);
    expect(r.kind).toBe("design");
    if (r.kind === "design") expect(r.design).toEqual({ deskSku: "X", totalPerMonth: 5 });
  });

  it("prefers rejectQuery when both terminal tools were called", () => {
    const r = resolveToolOutcome([
      { toolName: "searchCatalog", args: {} },
      { toolName: "rejectQuery", args: {} },
      { toolName: "finalizeDesign", args: { deskSku: "X" } },
    ]);
    expect(r.kind).toBe("rejection");
  });

  it("returns none when no terminal tool was called", () => {
    const r = resolveToolOutcome([{ toolName: "searchCatalog", args: {} }]);
    expect(r.kind).toBe("none");
  });

  it("returns none for an empty tool list", () => {
    expect(resolveToolOutcome([]).kind).toBe("none");
  });
});
