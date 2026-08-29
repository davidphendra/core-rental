import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildCatalog, placeholderSvg } from "../../../scripts/generate-catalog";
import { HERO_PRODUCTS } from "../../../scripts/curated-hero";
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from "../types/product";

const committed = JSON.parse(
  readFileSync(join(process.cwd(), "src/shared/data/products.json"), "utf8"),
) as Product[];

/** e09 contract: 3-letter code + 9 alnum chars, uppercase. */
const SKU_PATTERN = /^[A-Z]{3}[A-Z0-9]{9}$/;
const KNOWN_CODES = new Set(["CHA", "DSK", "MON", "LMP", "PLT", "CFE", "BBG", "EXT", "PTN"]);

describe("catalog integrity (decisions #19, #30, #31, #32; e09 SKU contract)", () => {
  it("matches the tiered volume per category (decision #30)", () => {
    const counts = committed.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts).toEqual({ chair: 10, desk: 10, accessory: 32, partner: 1 });
    expect(committed).toHaveLength(53);
  });

  it("every product is complete and typed", () => {
    for (const p of committed) {
      expect(p.skuNo, `skuNo for ${p.name}`).toBeTruthy();
      expect(p.name, `name for ${p.skuNo}`).toBeTruthy();
      expect(p.category, `category for ${p.skuNo}`).toBeOneOf([...PRODUCT_CATEGORIES] as string[]);
      expect(p.pricePerMonth, `price for ${p.skuNo}`).toBeGreaterThan(0);
      expect(Number.isInteger(p.pricePerMonth), `integer price for ${p.skuNo}`).toBe(true);
      expect(p.description, `description for ${p.skuNo}`).toBeTruthy();
      expect(p.image, `image for ${p.skuNo}`).toBeTruthy();
    }
  });

  it("skus are exactly 12 chars, alphanumeric, with a known code prefix", () => {
    for (const p of committed) {
      expect(p.skuNo, `sku format for ${p.name}`).toMatch(SKU_PATTERN);
      expect(KNOWN_CODES.has(p.skuNo.slice(0, 3)), `known code for ${p.name}`).toBe(true);
    }
  });

  it("skus are unique", () => {
    const skus = committed.map((p) => p.skuNo);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("no id field remains in the committed catalog (e09 rename)", () => {
    for (const p of committed) {
      expect((p as Record<string, unknown>).id, `no id on ${p.name}`).toBeUndefined();
    }
  });

  it("image paths are safe slugs (no traversal or control chars)", () => {
    for (const p of committed) {
      if (p.image.startsWith("/placeholders/")) {
        expect(p.image).toMatch(/^\/placeholders\/[a-z0-9-]+\.svg$/);
      } else {
        expect(p.image).toMatch(/^https:\/\//);
      }
    }
  });

  it("hero products win with mockup-exact names and Google image URLs (decision #31)", () => {
    for (const hero of HERO_PRODUCTS) {
      const found = committed.find((p) => p.skuNo === hero.skuNo);
      expect(found, `hero ${hero.skuNo} present`).toBeDefined();
      expect(found?.name).toBe(hero.name);
      expect(found?.pricePerMonth).toBe(hero.pricePerMonth);
      expect(found?.image).toMatch(/^https:\/\/lh3\.googleusercontent\.com\//);
    }
  });

  it("hero skus referenced by the generator resolve in the committed catalog", () => {
    const heroSkus = new Set(HERO_PRODUCTS.map((p) => p.skuNo));
    const committedSkus = new Set(committed.map((p) => p.skuNo));
    for (const sku of heroSkus) {
      expect(committedSkus.has(sku), `hero sku ${sku} in committed catalog`).toBe(true);
    }
  });

  it("accessory heroes carry a valid cap-key code (monstera → PLT — quirk gone)", () => {
    const monstera = committed.find((p) => p.name === "Monstera Plant");
    expect(monstera?.skuNo.slice(0, 3)).toBe("PLT");
  });

  it("generation is deterministic (decision #32)", () => {
    expect(JSON.stringify(buildCatalog())).toBe(JSON.stringify(committed));
  });

  it("no garage category exists (decision #6)", () => {
    const categories = new Set(committed.map((p) => p.category));
    expect(categories.has("garage" as ProductCategory)).toBe(false);
  });
});

describe("placeholderSvg (decision #31)", () => {
  const sample = committed.find((p) => p.image.startsWith("/placeholders/")) as Product;

  it("renders an XML-safe tile with name and price", () => {
    const svg = placeholderSvg(sample);
    expect(svg).toContain("<svg");
    expect(svg).toContain(sample.name);
    expect(svg).toContain(`Rp ${sample.pricePerMonth.toLocaleString("id-ID")}`);
    // XML-escape a hostile name to prove no injection path (threat model S2)
    expect(placeholderSvg({ ...sample, name: "<script>alert(1)</script>" })).not.toContain(
      "<script>",
    );
  });
});
