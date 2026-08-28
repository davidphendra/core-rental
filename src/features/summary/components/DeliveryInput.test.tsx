import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeliveryInput, isDeliveryValid } from "./DeliveryInput";

const onChange = () => undefined;

describe("DeliveryInput — G3 (trim, non-empty, ≤ 200 chars)", () => {
  it("shows an error for an empty value after blur", () => {
    render(<DeliveryInput value="" onChange={onChange} />);
    const input = screen.getByLabelText("Delivery Location");
    fireEvent.blur(input);
    expect(screen.getByText("Please enter a delivery location.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows an error for an over-length value", () => {
    render(<DeliveryInput value={"x".repeat(201)} onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText("Delivery Location"));
    expect(screen.getByText(/200 characters or fewer/)).toBeInTheDocument();
  });

  it("is valid after trimming and for ≤ 200 chars", () => {
    expect(isDeliveryValid("  Villa Lotus, Canggu  ")).toBe(true);
    expect(isDeliveryValid("x".repeat(200))).toBe(true);
    expect(isDeliveryValid("Villa Lotus, Jl. Raya Canggu\nKuta Utara, Badung")).toBe(true);
    expect(isDeliveryValid("")).toBe(false);
    expect(isDeliveryValid("   ")).toBe(false);
    expect(isDeliveryValid("x".repeat(201))).toBe(false);
  });
});
