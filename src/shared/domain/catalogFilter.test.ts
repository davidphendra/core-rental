import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import {
  CATALOG_FILTER_CATEGORIES,
  matchesCatalogFilter,
  matchesCategoryFilter,
} from "./catalogFilter";

const product = (over: Partial<Product>): Product => ({
  skuNo: "CHAA1B2C3D4E",
  name: "Uluwatu Chair",
  category: "chair",
  subCategory: null,
  pricePerMonth: 450_000,
  description: "Ergonomic mesh office chair for deep work.",
  image: "/c1.svg",
  ...over,
});

describe("CATALOG_FILTER_CATEGORIES (v1.14.0)", () => {
  it("exposes only the three builder categories", () => {
    expect(CATALOG_FILTER_CATEGORIES).toEqual(["chair", "desk", "accessory"]);
  });
});

describe("matchesCategoryFilter", () => {
  it("matches every product when no filter is given", () => {
    expect(matchesCategoryFilter(product({}), {})).toBe(true);
    expect(matchesCategoryFilter(product({ category: "accessory" }), {})).toBe(true);
  });

  it("matches on category", () => {
    const chair = product({ category: "chair" });
    expect(matchesCategoryFilter(chair, { category: "chair" })).toBe(true);
    expect(matchesCategoryFilter(chair, { category: "desk" })).toBe(false);
  });

  it("matches on subCategory (accessory subtype)", () => {
    const lamp = product({ category: "accessory", subCategory: "lamp" });
    expect(matchesCategoryFilter(lamp, { subCategory: "lamp" })).toBe(true);
    expect(matchesCategoryFilter(lamp, { subCategory: "monitor" })).toBe(false);
  });

  it("combines category and subCategory", () => {
    const lamp = product({ category: "accessory", subCategory: "lamp" });
    expect(matchesCategoryFilter(lamp, { category: "accessory", subCategory: "lamp" })).toBe(true);
    expect(matchesCategoryFilter(lamp, { category: "chair", subCategory: "lamp" })).toBe(false);
  });
});

describe("matchesCatalogFilter", () => {
  it("matches q case-insensitively on name", () => {
    const p = product({ name: "Uluwatu Gaming Chair" });
    expect(matchesCatalogFilter(p, { q: "gaming" })).toBe(true);
    expect(matchesCatalogFilter(p, { q: "GAMING" })).toBe(true);
    expect(matchesCatalogFilter(p, { q: "desk" })).toBe(false);
  });

  it("matches q on description too", () => {
    const p = product({ description: "Ergonomic mesh office chair" });
    expect(matchesCatalogFilter(p, { q: "ergonomic" })).toBe(true);
  });

  it("treats whitespace-only q as no filter", () => {
    const p = product({ name: "Anything" });
    expect(matchesCatalogFilter(p, { q: "   " })).toBe(true);
    expect(matchesCatalogFilter(p, { q: "" })).toBe(true);
    expect(matchesCatalogFilter(p, { q: undefined })).toBe(true);
  });

  it("combines category and q", () => {
    const lamp = product({
      category: "accessory",
      subCategory: "lamp",
      name: "Desk Lamp",
      description: "Bright adjustable lamp.",
    });
    expect(matchesCatalogFilter(lamp, { category: "accessory", q: "lamp" })).toBe(true);
    expect(matchesCatalogFilter(lamp, { category: "chair", q: "lamp" })).toBe(false);
    expect(matchesCatalogFilter(lamp, { category: "accessory", q: "chair" })).toBe(false);
  });
});
