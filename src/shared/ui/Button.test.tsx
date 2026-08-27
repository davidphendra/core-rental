import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button (a11y baseline #24)", () => {
  it("renders a button with accessible text", () => {
    render(<Button>Rent This Setup</Button>);
    expect(screen.getByRole("button", { name: "Rent This Setup" })).toBeInTheDocument();
  });

  it("applies variant classes and defaults to type=button", () => {
    const { container } = render(<Button variant="tertiary">Go</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("bg-tertiary-container");
    expect(button?.type).toBe("button");
  });

  it("respects disabled state", () => {
    render(
      <Button disabled onClick={() => undefined}>
        Rent
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Rent" })).toBeDisabled();
  });
});
