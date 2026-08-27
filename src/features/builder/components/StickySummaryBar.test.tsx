import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StickySummaryBar } from "./StickySummaryBar";

describe("StickySummaryBar (decision #7, mockup)", () => {
  it("shows the live monthly total in IDR", () => {
    render(<StickySummaryBar total={1_050_000} />);
    expect(screen.getByText("Monthly Total")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.050.000/mo")).toBeInTheDocument();
  });

  it("links to /summary", () => {
    render(<StickySummaryBar total={0} />);
    const link = screen.getByRole("link", { name: "View Setup Summary" });
    expect(link).toHaveAttribute("href", "/summary");
  });
});
