import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriceTag } from "./PriceTag";

describe("PriceTag (decision #3 single IDR home)", () => {
  it("formats amounts via formatIdr", () => {
    render(<PriceTag amount={750_000} />);
    expect(screen.getByText("Rp 750.000")).toBeInTheDocument();
  });

  it("appends an optional suffix", () => {
    render(<PriceTag amount={450_000} suffix="/mo" />);
    expect(screen.getByText(/Rp 450\.000/)).toBeInTheDocument();
    expect(screen.getByText("/mo")).toBeInTheDocument();
  });
});
