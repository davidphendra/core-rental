import { describe, expect, it } from "vitest";

import { formatIdr, monthlyTotal } from "./pricing";

describe("formatIdr (decision #3)", () => {
  it("formats with id-ID currency rules", () => {
    expect(formatIdr(750_000)).toBe("Rp 750.000");
    expect(formatIdr(0)).toBe("Rp 0");
    expect(formatIdr(1_500_000)).toBe("Rp 1.500.000");
  });

  it("drops fractional digits (IDR has no minor units)", () => {
    expect(formatIdr(750_000.4)).toBe("Rp 750.000");
  });
});

describe("monthlyTotal (decision #7)", () => {
  it("sums line items by price × quantity", () => {
    expect(
      monthlyTotal([
        { pricePerMonth: 450_000, quantity: 1 },
        { pricePerMonth: 300_000, quantity: 2 },
      ]),
    ).toBe(1_050_000);
  });

  it("returns 0 for an empty cart", () => {
    expect(monthlyTotal([])).toBe(0);
  });
});
