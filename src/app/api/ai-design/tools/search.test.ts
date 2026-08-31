import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { matchesCatalogFilter } from "@/shared/domain/catalogFilter";
import type { Product } from "@/shared/types/product";
import { searchCatalog } from "./search";

const ORIGIN = "http://localhost:3000";

/** Endpoint mimic: the mock filters the real committed catalog the way
 * /api/products does (shared predicate) so the tool tests the HTTP contract,
 * not the endpoint's own filtering (covered by products-route.test.ts). */
const committed = JSON.parse(
  readFileSync(join(process.cwd(), "src/shared/data/products.json"), "utf8"),
) as Product[];

function mockEndpoint() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input));
    const category = url.searchParams.get("category") ?? undefined;
    const subCategory = url.searchParams.get("subCategory") ?? undefined;
    const filtered = committed.filter((p) => matchesCatalogFilter(p, { category, subCategory }));
    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
}

describe("searchCatalog (v1.15.0: HTTP via /api/products contract)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the endpoint with the category param and returns lean hits", async () => {
    const fetchMock = mockEndpoint();
    const hits = await searchCatalog({ category: "chair" }, ORIGIN);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/products?category=chair");
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.skuNo.startsWith("CHA")).toBe(true);
  });

  it("normalizes subCategory to category=accessory (endpoint requires the pairing)", async () => {
    const fetchMock = mockEndpoint();
    const hits = await searchCatalog({ subCategory: "monitor" }, ORIGIN);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/products?category=accessory&subCategory=monitor",
    );
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.skuNo.startsWith("MON")).toBe(true);
  });

  it("sends both category and subCategory when the model provides category", async () => {
    const fetchMock = mockEndpoint();
    await searchCatalog({ category: "accessory", subCategory: "lamp" }, ORIGIN);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/products?category=accessory&subCategory=lamp",
    );
  });

  it("returns up to 8 lean candidates", async () => {
    mockEndpoint();
    const hits = await searchCatalog({}, ORIGIN);
    expect(hits.length).toBeLessThanOrEqual(8);
    for (const h of hits) {
      expect(h.description.length).toBeLessThanOrEqual(60);
      expect(h).toHaveProperty("skuNo");
      expect(h).toHaveProperty("name");
      expect(h).toHaveProperty("pricePerMonth");
    }
  });

  it("returns an empty list on a non-200 response (never crashes)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid subCategory" }), { status: 400 }),
    );
    const hits = await searchCatalog({ subCategory: "monitor" }, ORIGIN);
    expect(hits).toEqual([]);
  });

  it("returns an empty list on a network failure (never crashes)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const hits = await searchCatalog({ category: "chair" }, ORIGIN);
    expect(hits).toEqual([]);
  });

  it("returns an empty list on a malformed payload (never crashes)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ not: "an array" }), { status: 200 }),
    );
    const hits = await searchCatalog({ category: "chair" }, ORIGIN);
    expect(hits).toEqual([]);
  });
});

describe("catalog fixture sanity (why searchCatalog is never empty)", () => {
  it("has products for every category and sub-category", () => {
    for (const category of ["chair", "desk", "accessory"]) {
      const anyOf = committed.filter((p) => p.category === category);
      expect(anyOf.length).toBeGreaterThan(0);
    }
    for (const sub of ["monitor", "lamp", "plant", "coffee", "beanbag"]) {
      const anyOf = committed.filter((p) => p.subCategory === sub);
      expect(anyOf.length).toBeGreaterThan(0);
    }
  });
});
