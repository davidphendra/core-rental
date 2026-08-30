import { describe, expect, it } from "vitest";

import { GET } from "./route";
import { isProduct, isValidCatalog } from "@/shared/data/products";
import { PRODUCT_CATEGORIES } from "@/shared/types/product";

describe("GET /api/products (decision #25, E2)", () => {
  it("returns the committed catalog with 200", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("serves only well-typed products", async () => {
    const data = (await (await GET()).json()) as Array<Record<string, unknown>>;
    for (const p of data) {
      expect(isProduct(p)).toBe(true);
      expect(PRODUCT_CATEGORIES).toContain(p.category);
    }
  });
});

describe("isValidCatalog contract guard (E2, threat model S1)", () => {
  it("accepts a valid catalog", () => {
    expect(
      isValidCatalog([
        {
          skuNo: "CHAA1B2C3D4E",
          name: "A",
          pricePerMonth: 100,
          description: "d",
          image: "/x.svg",
          subCategory: null,
        },
      ]),
    ).toBe(true);
  });

  it("rejects empty, null, and non-array payloads", () => {
    expect(isValidCatalog([])).toBe(false);
    expect(isValidCatalog(null)).toBe(false);
    expect(isValidCatalog("products")).toBe(false);
    expect(isValidCatalog(undefined)).toBe(false);
  });

  it("rejects malformed entries", () => {
    expect(isValidCatalog([{}])).toBe(false);
    expect(isValidCatalog([{ skuNo: "CHAA1B2C3D4E" }])).toBe(false);
    expect(
      isValidCatalog([
        { skuNo: "CHAA1B2C3D4E", name: "A", pricePerMonth: 0, description: "d", image: "/x.svg" },
      ]),
    ).toBe(false);
  });
});
