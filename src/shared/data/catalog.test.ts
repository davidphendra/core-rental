import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildCatalog, placeholderSvg } from "../../../scripts/generate-catalog";
import { HERO_PRODUCTS } from "../../../scripts/curated-hero";
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from "../types/product";

const committed = JSON.parse(
  readFileSync(join(process.cwd(), "src/shared/data/products.json"), "utf8"),
) as Product[];

describe("catalog integrity (decisions #19, #30, #31, #32)", () => {
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
      expect(p.id, `id for ${p.name}`).toBeTruthy();
      expect(p.name, `name for ${p.id}`).toBeTruthy();
      expect(p.category, `category for ${p.id}`).toBeOneOf([...PRODUCT_CATEGORIES] as string[]);
      expect(p.pricePerMonth, `price for ${p.id}`).toBeGreaterThan(0);
      expect(Number.isInteger(p.pricePerMonth), `integer price for ${p.id}`).toBe(true);
      expect(p.description, `description for ${p.id}`).toBeTruthy();
      expect(p.image, `image for ${p.id}`).toBeTruthy();
    }
  });

  it("ids are unique", () => {
    const ids = committed.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
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
      const found = committed.find((p) => p.id === hero.id);
      expect(found, `hero ${hero.id} present`).toBeDefined();
      expect(found?.name).toBe(hero.name);
      expect(found?.pricePerMonth).toBe(hero.pricePerMonth);
      expect(found?.image).toMatch(/^https:\/\/lh3\.googleusercontent\.com\//);
    }
  });

  it("hero ids referenced by the generator resolve in the committed catalog", () => {
    const heroIds = new Set(HERO_PRODUCTS.map((p) => p.id));
    const committedIds = new Set(committed.map((p) => p.id));
    for (const id of heroIds) {
      expect(committedIds.has(id), `hero id ${id} in committed catalog`).toBe(true);
    }
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
