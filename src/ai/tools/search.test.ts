import { describe, expect, it } from "vitest";

import type { Product } from "@/shared/types/product";

import catalogJson from "../../shared/data/products.json";
import { searchCatalog } from "./search";

const catalog = catalogJson as unknown as readonly Product[];

describe("searchCatalog (category/subCategory retriever only)", () => {
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

  it("never returns empty for any valid category/subCategory combination", () => {
    for (const c of ["chair", "desk", "accessory"] as const) {
      expect(searchCatalog({ category: c }, catalog).length).toBeGreaterThan(0);
    }
    for (const sub of ["monitor", "lamp", "plant", "coffee", "beanbag"] as const) {
      expect(searchCatalog({ subCategory: sub }, catalog).length).toBeGreaterThan(0);
    }
  });

  it("returns up to 8 lean candidates when no filters are given", () => {
    const all = searchCatalog({}, catalog);
    expect(all.length).toBeGreaterThan(0);
    expect(all.length).toBeLessThanOrEqual(8);
    for (const h of all) expect(h.description.length).toBeLessThanOrEqual(60);
  });

  it("returns an empty list only for invalid enums", () => {
    expect(searchCatalog({ subCategory: "sofa" as never }, catalog)).toEqual([]);
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
