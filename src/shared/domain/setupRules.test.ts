import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import {
  QUANTITY_CAPS,
  canAdd,
  capKeyForProduct,
  defaultSelection,
  isCartEligible,
} from "./setupRules";

const prod = (id: string, category: Product["category"]): Product => ({
  id,
  name: id,
  category,
  pricePerMonth: 100_000,
  description: "d",
  image: "/x.svg",
});

describe("capKeyForProduct (decision #22)", () => {
  it("derives cap keys from accessory ids", () => {
    expect(capKeyForProduct(prod("accessory-monitor-x", "accessory"))).toBe("monitor");
    expect(capKeyForProduct(prod("accessory-plant-x", "accessory"))).toBe("plant");
    expect(capKeyForProduct(prod("accessory-coffee-x", "accessory"))).toBe("coffee");
    expect(capKeyForProduct(prod("accessory-beanbag-x", "accessory"))).toBe("beanbag");
  });

  it("maps extra to the extra cap", () => {
    expect(capKeyForProduct(prod("extra-surfboard", "extra"))).toBe("extra");
  });

  it("returns null for single-select and excluded categories", () => {
    expect(capKeyForProduct(prod("chair-x", "chair"))).toBeNull();
    expect(capKeyForProduct(prod("desk-x", "desk"))).toBeNull();
    expect(capKeyForProduct(prod("partner-x", "partner"))).toBeNull();
  });

  it("caps table matches decision #22", () => {
    expect(QUANTITY_CAPS).toEqual({
      monitor: 3,
      plant: 4,
      lamp: 2,
      coffee: 1,
      beanbag: 2,
      extra: 1,
    });
  });
});

describe("isCartEligible (decision #20)", () => {
  it("excludes partner products from the cart", () => {
    expect(isCartEligible(prod("partner-x", "partner"))).toBe(false);
    expect(isCartEligible(prod("chair-x", "chair"))).toBe(true);
    expect(isCartEligible(prod("extra-x", "extra"))).toBe(true);
  });
});

describe("canAdd (G2, N3)", () => {
  it("rejects partner products outright", () => {
    expect(canAdd({ quantities: {} }, prod("partner-x", "partner"))).toBe(false);
  });

  it("rejects over-cap additions (boundary: at cap)", () => {
    const monitor = prod("accessory-monitor-x", "accessory");
    expect(canAdd({ quantities: { "accessory-monitor-x": 3 } }, monitor)).toBe(false);
    expect(canAdd({ quantities: { "accessory-monitor-x": 2 } }, monitor)).toBe(true);
  });

  it("allows single-select categories", () => {
    expect(canAdd({ quantities: {} }, prod("chair-x", "chair"))).toBe(true);
  });
});

describe("defaultSelection (D1)", () => {
  it("returns the first chair and first desk", () => {
    const catalog = [
      prod("desk-b", "desk"),
      prod("chair-a", "chair"),
      prod("chair-c", "chair"),
      prod("desk-d", "desk"),
    ];
    expect(defaultSelection(catalog)).toEqual({ chairId: "chair-a", deskId: "desk-b" });
  });

  it("returns nulls when a category is missing", () => {
    expect(defaultSelection([prod("chair-a", "chair")])).toEqual({
      chairId: "chair-a",
      deskId: null,
    });
    expect(defaultSelection([])).toEqual({ chairId: null, deskId: null });
  });
});
