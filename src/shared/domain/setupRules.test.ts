import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import { QUANTITY_CAPS, canAdd, capKeyForProduct, isCartEligible } from "./setupRules";

/**
 * e09: products are identified by 12-char skuNo (3-letter code + 9 alnum).
 * Codes: CHA/DSK single-select, MON/LMP/PLT/CFE/BBG accessory caps,
 * PTN partner (excluded).
 */
const prod = (skuNo: string, category: Product["category"]): Product => ({
  skuNo,
  name: skuNo,
  category,
  subCategory: null,
  pricePerMonth: 100_000,
  description: "d",
  image: "/x.svg",
});

const MON = "MONA1B2C3D4E";
const PLT = "PLTA1B2C3D4E";
const CFE = "CFEA1B2C3D4E";
const BBG = "BBGA1B2C3D4E";
const CHA = "CHAA1B2C3D4E";
const DSK = "DSKA1B2C3D4E";
const PTN = "PTNA1B2C3D4E";

describe("capKeyForProduct (decision #22; e09 sku-prefix derivation)", () => {
  it("derives cap keys from the sku code prefix", () => {
    expect(capKeyForProduct(prod(MON, "accessory"))).toBe("monitor");
    expect(capKeyForProduct(prod(PLT, "accessory"))).toBe("plant");
    expect(capKeyForProduct(prod(CFE, "accessory"))).toBe("coffee");
    expect(capKeyForProduct(prod(BBG, "accessory"))).toBe("beanbag");
    expect(capKeyForProduct(prod("LMPA1B2C3D4E", "accessory"))).toBe("lamp");
  });

  it("returns null for single-select and excluded categories", () => {
    expect(capKeyForProduct(prod(CHA, "chair"))).toBeNull();
    expect(capKeyForProduct(prod(DSK, "desk"))).toBeNull();
    expect(capKeyForProduct(prod(PTN, "partner"))).toBeNull();
  });

  it("caps table matches decision #22", () => {
    expect(QUANTITY_CAPS).toEqual({
      monitor: 3,
      plant: 1,
      lamp: 1,
      coffee: 1,
      beanbag: 1,
    });
  });
});

describe("isCartEligible (decision #20)", () => {
  it("excludes partner products from the cart", () => {
    expect(isCartEligible(prod(PTN, "partner"))).toBe(false);
    expect(isCartEligible(prod(CHA, "chair"))).toBe(true);
  });
});

describe("canAdd (G2, N3)", () => {
  it("rejects partner products outright", () => {
    expect(canAdd({ quantities: {} }, prod(PTN, "partner"))).toBe(false);
  });

  it("rejects over-cap additions (boundary: at cap)", () => {
    const monitor = prod(MON, "accessory");
    expect(canAdd({ quantities: { [MON]: 3 } }, monitor)).toBe(false);
    expect(canAdd({ quantities: { [MON]: 2 } }, monitor)).toBe(true);
  });

  it("allows single-select categories", () => {
    expect(canAdd({ quantities: {} }, prod(CHA, "chair"))).toBe(true);
  });
});
