import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { BuilderCanvas } from "./BuilderCanvas";

const catalog: Product[] = [
  {
    skuNo: "chair-a",
    name: "Uluwatu Chair",
    category: "chair",
    pricePerMonth: 450_000,
    description: "d",
    image: "/c.svg",
  },
  {
    skuNo: "desk-a",
    name: "Seminyak Desk",
    category: "desk",
    pricePerMonth: 800_000,
    description: "d",
    image: "/d.svg",
  },
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
  {
    skuNo: "PLTA1B2C3D4E",
    name: "Plant 1",
    category: "accessory",
    pricePerMonth: 100_000,
    description: "d",
    image: "/p1.svg",
  },
  {
    skuNo: "CFEA1B2C3D4E",
    name: "Espresso",
    category: "accessory",
    pricePerMonth: 750_000,
    description: "d",
    image: "/c1.svg",
  },
  {
    skuNo: "BBGA1B2C3D4E",
    name: "Bean Bag",
    category: "accessory",
    pricePerMonth: 350_000,
    description: "d",
    image: "/b1.svg",
  },
];

function Harness({
  children,
  initial = EMPTY_SETUP,
}: {
  children: ReactNode;
  initial?: ReturnType<typeof useBuilderReducer>[0];
}) {
  const [state, dispatch] = useBuilderReducer(initial);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("BuilderCanvas (decisions #10, #22, D1)", () => {
  it("renders dashed empty slots when the cart is empty", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("button", { name: "Add Monitor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Lamp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Place a Plant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Machine" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Bean Bag" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No chair selected" })).toBeInTheDocument();
  });

  it("renders desk and chair from the cart", () => {
    render(
      <Harness initial={{ chairId: "chair-a", deskId: "desk-a", quantities: {} }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("img", { name: "Uluwatu Chair" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Seminyak Desk" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Desk table" })).toBeInTheDocument();
    expect(screen.queryByText("Add a desk from the panel")).not.toBeInTheDocument();
    expect(screen.queryByText("No chair selected")).not.toBeInTheDocument();
  });

  it("clicking an empty slot adds the first product of its cap key", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Monitor" }));
    expect(screen.getByRole("button", { name: "Monitor: 1" })).toBeInTheDocument();
  });

  it("shows the quantity badge and respects caps (N3)", () => {
    const monitor = "MONA1B2C3D4E";
    render(
      <Harness initial={{ chairId: null, deskId: null, quantities: { [monitor]: 3 } }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("button", { name: "Monitor: 3" })).toBeInTheDocument();
    // At cap: clicking must not exceed 3 (reducer rejects too — G2).
    fireEvent.click(screen.getByRole("button", { name: "Monitor: 3" }));
    expect(screen.getByRole("button", { name: "Monitor: 3" })).toBeInTheDocument();
  });

  it("removes a filled slot directly via its × button (decrements, then empties)", () => {
    render(
      <Harness initial={{ chairId: null, deskId: null, quantities: { MONA1B2C3D4E: 2 } }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    // Decrement: 2 -> 1
    fireEvent.click(screen.getByRole("button", { name: "Remove Monitor" }));
    expect(screen.getByRole("button", { name: "Monitor: 1" })).toBeInTheDocument();
    // Remove: 1 -> dashed empty slot
    fireEvent.click(screen.getByRole("button", { name: "Remove Monitor" }));
    expect(screen.getByRole("button", { name: "Add Monitor" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove Monitor/ })).not.toBeInTheDocument();
  });

  it("removes the selected chair and desk directly via their × buttons", () => {
    render(
      <Harness initial={{ chairId: "chair-a", deskId: "desk-a", quantities: {} }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("img", { name: "Uluwatu Chair" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Desk table" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove chair" }));
    expect(screen.queryByRole("img", { name: "Uluwatu Chair" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No chair selected" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove desk" }));
    // The table stays; only the product image + hint change.
    expect(screen.getByRole("img", { name: "Desk table" })).toBeInTheDocument();
    expect(screen.getByText("Add a desk from the panel")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Seminyak Desk" })).not.toBeInTheDocument();
  });

  it("fills zone tiles when the zone item is in the cart", () => {
    render(
      <Harness initial={{ chairId: null, deskId: null, quantities: { CFEA1B2C3D4E: 1 } }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("button", { name: "Coffee Station: 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Bean Bag" })).toBeInTheDocument();
  });
});
