import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "./ErrorState";

describe("ErrorState (D4, decision #28)", () => {
  it("renders friendly copy in an alert role", () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("calls onRetry when Try again is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed" onRetry={onRetry} />);
    screen.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders no raw error text when a retry handler is absent", () => {
    render(<ErrorState message="Products unavailable" />);
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
