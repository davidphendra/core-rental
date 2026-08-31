import { describe, expect, it } from "vitest";

import { extractBudgetIdr } from "./input";

describe("extractBudgetIdr", () => {
  it("parses Indonesian 'juta' and 'jt' units to millions", () => {
    expect(extractBudgetIdr("fancy gaming workspace max 30 juta")).toBe(30_000_000);
    expect(extractBudgetIdr("budget 5 jt")).toBe(5_000_000);
    expect(extractBudgetIdr("5jt minimal")).toBe(5_000_000);
  });
});
