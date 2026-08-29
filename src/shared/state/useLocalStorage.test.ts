import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "../types/product";
import { readStoredSetup, writeStoredSetup, STORAGE_KEY } from "./useLocalStorage";

const catalog: Product[] = [
  {
    skuNo: "chair-a",
    name: "A",
    category: "chair",
    pricePerMonth: 100,
    description: "d",
    image: "/c.svg",
  },
  {
    skuNo: "desk-a",
    name: "D",
    category: "desk",
    pricePerMonth: 200,
    description: "d",
    image: "/d.svg",
  },
];

const validSetup = { chairId: "chair-a", deskId: "desk-a", quantities: {} };

describe("readStoredSetup (G1 validate-and-fallback)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when nothing is stored", () => {
    expect(readStoredSetup(catalog)).toBeNull();
  });

  it("reads a valid stored setup", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validSetup));
    expect(readStoredSetup(catalog)).toEqual(validSetup);
  });

  it("returns null for unparseable payloads (falls back to defaults)", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readStoredSetup(catalog)).toBeNull();
  });

  it("returns null for invalid shapes (tampered storage)", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chairId: "ghost", deskId: null, quantities: {} }),
    );
    expect(readStoredSetup(catalog)).toBeNull();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chairId: "chair-a", deskId: "desk-a", quantities: { nope: 99 } }),
    );
    expect(readStoredSetup(catalog)).toBeNull();
  });
});

describe("writeStoredSetup (E3 quota guard)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists a valid setup", () => {
    expect(writeStoredSetup(validSetup)).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(validSetup));
  });

  it("warns and returns false when setItem throws (QuotaExceededError)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    expect(writeStoredSetup(validSetup)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("storage.degraded"));
  });
});
