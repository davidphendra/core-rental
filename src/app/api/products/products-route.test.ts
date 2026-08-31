import { describe, expect, it } from "vitest";

import { GET } from "./route";
import { isProduct, isValidCatalog } from "@/shared/data/products";
import { PRODUCT_CATEGORIES } from "@/shared/types/product";

const url = (query: string) => new Request(`http://localhost/api/products${query}`);

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

describe("GET /api/products?category= (v1.14.0 backend filtering)", () => {
  it("filters to the requested category only", async () => {
    const res = await GET(url("?category=desk"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<Record<string, unknown>>;
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) {
      expect(p.category).toBe("desk");
    }
  });

  it("serves chairs and accessories too", async () => {
    for (const category of ["chair", "accessory"]) {
      const data = (await (await GET(url(`?category=${category}`))).json()) as Array<
        Record<string, unknown>
      >;
      expect(data.length).toBeGreaterThan(0);
      for (const p of data) expect(p.category).toBe(category);
    }
  });

  it("rejects an unknown category with 400 and no internals", async () => {
    const res = await GET(url("?category=sofa"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBeTypeOf("string");
    expect(JSON.stringify(body)).not.toMatch(/stack|at |internal/i);
  });
});

describe("GET /api/products?subCategory= (v1.15.0 accessory subtype)", () => {
  it("filters accessories to the requested subtype", async () => {
    const res = await GET(url("?category=accessory&subCategory=monitor"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<Record<string, unknown>>;
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) {
      expect(p.category).toBe("accessory");
      expect(p.subCategory).toBe("monitor");
    }
  });

  it("rejects subCategory without category=accessory (400)", async () => {
    const res = await GET(url("?subCategory=monitor"));
    expect(res.status).toBe(400);
    const resDesk = await GET(url("?category=desk&subCategory=monitor"));
    expect(resDesk.status).toBe(400);
  });

  it("rejects an unknown subCategory value (400)", async () => {
    const res = await GET(url("?category=accessory&subCategory=sofa"));
    expect(res.status).toBe(400);
  });

  it("accepts every valid subtype", async () => {
    for (const sub of ["lamp", "plant", "coffee", "beanbag"]) {
      const res = await GET(url(`?category=accessory&subCategory=${sub}`));
      expect(res.status).toBe(200);
      const data = (await res.json()) as Array<Record<string, unknown>>;
      expect(data.length).toBeGreaterThan(0);
      for (const p of data) expect(p.subCategory).toBe(sub);
    }
  });
});

describe("GET /api/products?q= (v1.14.0 keyword filter)", () => {
  it("returns only products whose name or description matches (case-insensitive)", async () => {
    const all = (await (await GET()).json()) as Array<Record<string, unknown>>;
    const res = await GET(url("?q=gaming"));
    const data = (await res.json()) as Array<Record<string, unknown>>;
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThan(all.length);
    for (const p of data) {
      const haystack = `${String(p.name)} ${String(p.description)}`.toLowerCase();
      expect(haystack).toContain("gaming");
    }
  });

  it("combines category and q", async () => {
    const res = await GET(url("?category=accessory&q=gaming"));
    const data = (await res.json()) as Array<Record<string, unknown>>;
    for (const p of data) {
      expect(p.category).toBe("accessory");
      const haystack = `${String(p.name)} ${String(p.description)}`.toLowerCase();
      expect(haystack).toContain("gaming");
    }
  });

  it("treats whitespace-only q as no filter", async () => {
    const all = (await (await GET()).json()) as Array<Record<string, unknown>>;
    const res = await GET(url("?q=%20%20"));
    const data = (await res.json()) as Array<Record<string, unknown>>;
    expect(data.length).toBe(all.length);
  });

  it("returns an empty list (200) when nothing matches", async () => {
    const res = await GET(url("?q=zzzzzzzzzzz"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toEqual([]);
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
