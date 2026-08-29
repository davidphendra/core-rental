import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import type { SetupState } from "@/shared/types/setup";

import { StickySummaryBar } from "./StickySummaryBar";

function Harness({
  initial = EMPTY_SETUP,
  children,
}: {
  initial?: SetupState;
  children: ReactNode;
}) {
  const [state, dispatch] = useBuilderReducer(initial);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("StickySummaryBar (decision #7, mockup)", () => {
  it("shows the live monthly total in IDR", () => {
    render(
      <Harness>
        <StickySummaryBar total={1_050_000} />
      </Harness>,
    );
    expect(screen.getByText("Monthly Total")).toBeInTheDocument();
    expect(screen.getByText(/Rp 1\.050\.000/)).toBeInTheDocument();
  });

  it("links to /summary when both a chair and desk are selected", () => {
    render(
      <Harness initial={{ chairId: "chair-a", deskId: "desk-a", quantities: {}, monitorSlots: [] }}>
        <StickySummaryBar total={0} />
      </Harness>,
    );
    const link = screen.getByRole("link", { name: "View Setup Summary" });
    expect(link).toHaveAttribute("href", "/summary");
  });

  it("disables the CTA when no chair/desk is selected (UX ruling)", () => {
    render(
      <Harness initial={{ chairId: null, deskId: null, quantities: {}, monitorSlots: [] }}>
        <StickySummaryBar total={500_000} />
      </Harness>,
    );
    expect(screen.queryByRole("link", { name: "View Setup Summary" })).not.toBeInTheDocument();
    const cta = screen.getByRole("button", { name: "View Setup Summary" });
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the CTA when only ONE of chair/desk is selected", () => {
    render(
      <Harness initial={{ chairId: "chair-a", deskId: null, quantities: {}, monitorSlots: [] }}>
        <StickySummaryBar total={0} />
      </Harness>,
    );
    expect(screen.queryByRole("link", { name: "View Setup Summary" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Setup Summary" })).toBeDisabled();
  });
});
