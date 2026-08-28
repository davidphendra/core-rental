import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PHRASE, DemoVerifyModal, matchesDemoPhrase } from "./DemoVerifyModal";

describe("matchesDemoPhrase (grilled: trimmed + case-insensitive)", () => {
  it("matches the exact phrase", () => {
    expect(matchesDemoPhrase(DEMO_PHRASE)).toBe(true);
  });

  it("matches with surrounding whitespace and any casing", () => {
    expect(matchesDemoPhrase("  this is a demo  ")).toBe(true);
    expect(matchesDemoPhrase("THIS IS A DEMO")).toBe(true);
    expect(matchesDemoPhrase("This Is A Demo")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(matchesDemoPhrase("")).toBe(false);
    expect(matchesDemoPhrase("this is not a demo")).toBe(false);
    expect(matchesDemoPhrase("this is a demo!")).toBe(false);
  });
});

describe("DemoVerifyModal (C2 gate)", () => {
  it("disables OK until the phrase matches, then confirms", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<DemoVerifyModal onConfirm={onConfirm} onClose={onClose} />);

    const ok = screen.getByRole("button", { name: "OK" });
    expect(ok).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Confirmation phrase"), {
      target: { value: "THIS IS A DEMO" },
    });
    expect(ok).toBeEnabled();

    fireEvent.click(ok);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows a validation error after blur for a non-match and keeps OK disabled", () => {
    render(<DemoVerifyModal onConfirm={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText("Confirmation phrase");

    // No error before interaction.
    expect(screen.queryByText(/doesn't match/i)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "wrong phrase" } });
    fireEvent.blur(input);
    expect(screen.getByText(/doesn't match/i)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();

    // Error clears live once the phrase matches.
    fireEvent.change(input, { target: { value: "this is a demo" } });
    expect(screen.queryByText(/doesn't match/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeEnabled();
  });

  it("Enter submits the form when matched", () => {
    const onConfirm = vi.fn();
    render(<DemoVerifyModal onConfirm={onConfirm} onClose={vi.fn()} />);
    const input = screen.getByLabelText("Confirmation phrase");
    fireEvent.change(input, { target: { value: DEMO_PHRASE } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Cancel and Escape close without confirming", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<DemoVerifyModal onConfirm={onConfirm} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders with dialog semantics and autofocuses the input", () => {
    render(<DemoVerifyModal onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Confirm this is a demo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmation phrase")).toHaveFocus();
  });
});
