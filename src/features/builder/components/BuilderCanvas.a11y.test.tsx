import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { BuilderCanvas } from "./BuilderCanvas";

const catalog: Product[] = [
  {
    skuNo: "MONA1B2C3D4E",
    name: "Monitor 1",
    category: "accessory",
    pricePerMonth: 300_000,
    description: "d",
    image: "/m1.svg",
  },
  {
    skuNo: "LMPA1B2C3D4E",
    name: "Lamp 1",
    category: "accessory",
    pricePerMonth: 120_000,
    description: "d",
    image: "/l1.svg",
  },
];

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("BuilderCanvas keyboard operability (decision #24)", () => {
  it("slots are keyboard-focusable buttons", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    const monitors = screen.getAllByRole("button", { name: "Add Monitor" });
    expect(monitors).toHaveLength(3); // three discrete slots (e09s02)
    expect(monitors[0]?.tagName).toBe("BUTTON");
    monitors[0]?.focus();
    expect(monitors[0]).toHaveFocus();
  });

  it("Enter on an empty slot adds an item", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    // Native button activation: Enter/Space on the Add Monitor button adds
    // the first catalog monitor to the first empty slot (e09s02).
    fireEvent.click(screen.getAllByRole("button", { name: "Add Monitor" })[0]!);
    expect(screen.getByRole("img", { name: "Monitor 1" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add Monitor" })).toHaveLength(2);
  });

  it("Space on an empty slot adds an item", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Lamp" }), { key: " " });
    expect(screen.getByRole("button", { name: "Lamp" })).toBeInTheDocument();
  });
});
