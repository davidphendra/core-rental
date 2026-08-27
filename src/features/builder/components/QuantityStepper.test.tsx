import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { QuantityStepper } from "./QuantityStepper";

const monitor: Product = {
  id: "accessory-monitor-m1",
  name: "Monitor 1",
  category: "accessory",
  pricePerMonth: 300_000,
  description: "d",
  image: "/m1.svg",
};

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

function AtCap({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer({
    chairId: null,
    deskId: null,
    quantities: { "accessory-monitor-m1": 3 },
  });
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("QuantityStepper (decisions #10, #22, N3)", () => {
  it("starts at zero with the decrement disabled", () => {
    render(
      <Harness>
        <QuantityStepper product={monitor} />
      </Harness>,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Monitor 1" })).toBeDisabled();
  });

  it("increments and decrements", () => {
    render(
      <Harness>
        <QuantityStepper product={monitor} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Monitor 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Monitor 1" }));
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Monitor 1" }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("disables the add button at cap (N3)", () => {
    render(
      <AtCap>
        <QuantityStepper product={monitor} />
      </AtCap>,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Monitor 1" })).toBeDisabled();
  });
});
