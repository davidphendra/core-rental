import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { BuilderCanvas } from "./BuilderCanvas";

const catalog: Product[] = [
  {
    id: "chair-a",
    name: "Uluwatu Chair",
    category: "chair",
    pricePerMonth: 450_000,
    description: "d",
    image: "/c.svg",
  },
  {
    id: "desk-a",
    name: "Seminyak Desk",
    category: "desk",
    pricePerMonth: 800_000,
    description: "d",
    image: "/d.svg",
  },
  {
    id: "accessory-monitor-m1",
    name: "Monitor 1",
    category: "accessory",
    pricePerMonth: 300_000,
    description: "d",
    image: "/m1.svg",
  },
  {
    id: "accessory-lamp-l1",
    name: "Lamp 1",
    category: "accessory",
    pricePerMonth: 120_000,
    description: "d",
    image: "/l1.svg",
  },
  {
    id: "accessory-plant-p1",
    name: "Plant 1",
    category: "accessory",
    pricePerMonth: 100_000,
    description: "d",
    image: "/p1.svg",
  },
  {
    id: "accessory-coffee-c1",
    name: "Espresso",
    category: "accessory",
    pricePerMonth: 750_000,
    description: "d",
    image: "/c1.svg",
  },
  {
    id: "accessory-beanbag-b1",
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
    expect(screen.getByRole("img", { name: "Selected desk" })).toBeInTheDocument();
    expect(screen.queryByText("No desk selected")).not.toBeInTheDocument();
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
    const monitor = "accessory-monitor-m1";
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

  it("fills zone tiles when the zone item is in the cart", () => {
    render(
      <Harness initial={{ chairId: null, deskId: null, quantities: { "accessory-coffee-c1": 1 } }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("button", { name: "Coffee Station: 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Bean Bag" })).toBeInTheDocument();
  });
});
