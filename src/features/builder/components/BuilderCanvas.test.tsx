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
    skuNo: "MONA1B2C3D4F",
    name: "Monitor 2",
    category: "accessory",
    pricePerMonth: 310_000,
    description: "d",
    image: "/m2.svg",
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
    expect(screen.getAllByRole("button", { name: "Add Monitor" })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Add Lamp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Place a Plant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Machine" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Bean Bag" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a chair from the panel" })).toBeInTheDocument();
  });

  it("renders desk and chair from the cart", () => {
    render(
      <Harness initial={{ chairId: "chair-a", deskId: "desk-a", quantities: {}, monitorSlots: [] }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("img", { name: "Uluwatu Chair" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Seminyak Desk" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Desk table" })).toBeInTheDocument();
    expect(screen.queryByText("Add a desk from the panel")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add a chair from the panel" }),
    ).not.toBeInTheDocument();
  });

  it("clicking an empty monitor slot adds the first catalog monitor (e09s02)", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Add Monitor" })[0]!);
    expect(screen.getByRole("img", { name: "Monitor 1" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add Monitor" })).toHaveLength(2);
  });

  it("fills three monitor slots; a full row has no Add buttons left (cap 3)", () => {
    render(
      <Harness
        initial={{
          chairId: null,
          deskId: null,
          quantities: {},
          monitorSlots: ["MONA1B2C3D4E", "MONA1B2C3D4E", "MONA1B2C3D4F"],
        }}
      >
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getAllByRole("img", { name: "Monitor 1" })).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Monitor 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Monitor" })).not.toBeInTheDocument();
  });

  it("removes a monitor slot directly via its × button (e09s02)", () => {
    render(
      <Harness
        initial={{
          chairId: null,
          deskId: null,
          quantities: {},
          monitorSlots: ["MONA1B2C3D4E", "MONA1B2C3D4F"],
        }}
      >
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getAllByRole("button", { name: "Remove Monitor" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove Monitor" })[0]!);
    expect(screen.getAllByRole("button", { name: "Remove Monitor" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Add Monitor" })).toHaveLength(2);
  });

  it("removes the selected chair and desk directly via their × buttons", () => {
    render(
      <Harness initial={{ chairId: "chair-a", deskId: "desk-a", quantities: {}, monitorSlots: [] }}>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("img", { name: "Uluwatu Chair" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Desk table" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove chair" }));
    expect(screen.queryByRole("img", { name: "Uluwatu Chair" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a chair from the panel" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove desk" }));
    // The table stays; only the product image + hint change.
    expect(screen.getByRole("img", { name: "Desk table" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a desk from the panel" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Seminyak Desk" })).not.toBeInTheDocument();
  });

  it("the empty chair hint button selects the first chair (e09s03)", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add a chair from the panel" }));
    expect(screen.getByRole("img", { name: "Uluwatu Chair" })).toBeInTheDocument();
  });

  it("the empty desk hint button selects the first desk (e09s03)", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add a desk from the panel" }));
    expect(screen.getByRole("img", { name: "Seminyak Desk" })).toBeInTheDocument();
  });

  it("fills zone tiles when the zone item is in the cart", () => {
    render(
      <Harness
        initial={{ chairId: null, deskId: null, quantities: { CFEA1B2C3D4E: 1 }, monitorSlots: [] }}
      >
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("button", { name: "Coffee Station: 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Bean Bag" })).toBeInTheDocument();
  });
});
