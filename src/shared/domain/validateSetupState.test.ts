import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import {
  DELIVERY_MAX_LENGTH,
  validateDeliveryLocation,
  validateSetupState,
} from "./validateSetupState";

const catalog: Product[] = [
  {
    id: "chair-a",
    name: "Chair A",
    category: "chair",
    pricePerMonth: 100,
    description: "d",
    image: "/c.svg",
  },
  {
    id: "desk-a",
    name: "Desk A",
    category: "desk",
    pricePerMonth: 100,
    description: "d",
    image: "/d.svg",
  },
  {
    id: "accessory-monitor-m1",
    name: "M1",
    category: "accessory",
    pricePerMonth: 100,
    description: "d",
    image: "/m.svg",
  },
  {
    id: "accessory-plant-p1",
    name: "P1",
    category: "accessory",
    pricePerMonth: 100,
    description: "d",
    image: "/p.svg",
  },
  {
    id: "partner-moto",
    name: "Moto",
    category: "partner",
    pricePerMonth: 100,
    description: "d",
    image: "/x.svg",
  },
];

const valid = {
  chairId: "chair-a",
  deskId: "desk-a",
  quantities: { "accessory-monitor-m1": 2 },
  deliveryLocation: "Villa Lotus, Canggu",
};

describe("validateSetupState — G1 trust boundary (threat model M1)", () => {
  it("accepts a valid setup", () => {
    expect(validateSetupState(valid, catalog)).toEqual(valid);
  });

  it("accepts nulls for chair/desk and empty quantities", () => {
    expect(validateSetupState({ chairId: null, deskId: null, quantities: {} }, catalog)).toEqual({
      chairId: null,
      deskId: null,
      quantities: {},
    });
  });

  it("rejects non-object payloads", () => {
    expect(validateSetupState(null, catalog)).toBeNull();
    expect(validateSetupState("setup", catalog)).toBeNull();
    expect(validateSetupState([], catalog)).toBeNull();
    expect(validateSetupState(undefined, catalog)).toBeNull();
  });

  it("rejects unknown or wrong-category ids", () => {
    expect(validateSetupState({ ...valid, chairId: "nope" }, catalog)).toBeNull();
    expect(validateSetupState({ ...valid, chairId: "desk-a" }, catalog)).toBeNull(); // desk as chair
    expect(validateSetupState({ ...valid, deskId: "chair-a" }, catalog)).toBeNull();
  });

  it("rejects over-cap, negative, non-integer, and unknown quantities", () => {
    expect(
      validateSetupState({ ...valid, quantities: { "accessory-monitor-m1": 4 } }, catalog),
    ).toBeNull(); // cap 3
    expect(
      validateSetupState({ ...valid, quantities: { "accessory-monitor-m1": 0 } }, catalog),
    ).toBeNull();
    expect(
      validateSetupState({ ...valid, quantities: { "accessory-monitor-m1": -1 } }, catalog),
    ).toBeNull();
    expect(
      validateSetupState({ ...valid, quantities: { "accessory-monitor-m1": 1.5 } }, catalog),
    ).toBeNull();
    expect(
      validateSetupState({ ...valid, quantities: { "accessory-plant-p1": 5 } }, catalog),
    ).toBeNull(); // cap 4
    expect(validateSetupState({ ...valid, quantities: { ghost: 1 } }, catalog)).toBeNull();
  });

  it("rejects partner items in quantities", () => {
    expect(validateSetupState({ ...valid, quantities: { "partner-moto": 1 } }, catalog)).toBeNull();
  });

  it("rejects invalid delivery locations", () => {
    expect(validateSetupState({ ...valid, deliveryLocation: "   " }, catalog)).toBeNull();
    expect(
      validateSetupState(
        { ...valid, deliveryLocation: "x".repeat(DELIVERY_MAX_LENGTH + 1) },
        catalog,
      ),
    ).toBeNull();
    expect(validateSetupState({ ...valid, deliveryLocation: 42 }, catalog)).toBeNull();
  });

  it("trims a valid delivery location", () => {
    const result = validateSetupState({ ...valid, deliveryLocation: "  Canggu  " }, catalog);
    expect(result?.deliveryLocation).toBe("Canggu");
  });
});

describe("validateDeliveryLocation (G3)", () => {
  it("accepts a trimmed non-empty value ≤ 120 chars", () => {
    expect(validateDeliveryLocation("Villa Lotus, Canggu")).toBe("Villa Lotus, Canggu");
    expect(validateDeliveryLocation("  Ubud  ")).toBe("Ubud");
  });

  it("rejects empty, whitespace-only, over-length, and non-strings", () => {
    expect(validateDeliveryLocation("")).toBeNull();
    expect(validateDeliveryLocation("   ")).toBeNull();
    expect(validateDeliveryLocation("x".repeat(121))).toBeNull();
    expect(validateDeliveryLocation(null)).toBeNull();
    expect(validateDeliveryLocation(42)).toBeNull();
  });
});
