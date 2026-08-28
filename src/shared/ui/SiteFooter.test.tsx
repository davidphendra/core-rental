import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("shows the app version (git semantic version) centered", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    // Version comes from the generated config (git tag, e.g. v1.7.0).
    expect(screen.getByText(/Core Rental · \d+\.\d+\.\d+/)).toBeInTheDocument();
  });
});
