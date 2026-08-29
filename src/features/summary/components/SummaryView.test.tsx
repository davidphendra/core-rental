import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { SummaryView } from "./SummaryView";

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
    image: "/m.svg",
  },
  {
    skuNo: "accessory-coffee-c1",
    name: "Espresso",
    category: "accessory",
    pricePerMonth: 750_000,
    description: "d",
    image: "/c1.svg",
  },
];

function Harness({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: ReturnType<typeof useBuilderReducer>[0];
}) {
  const [state, dispatch] = useBuilderReducer(
    initial ?? { chairId: "chair-a", deskId: "desk-a", quantities: {}, monitorSlots: [] },
  );
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("SummaryView (decisions C1, C3, #7, N1)", () => {
  it("shows line items with Qty and the Monthly Total only (C1 — no fee rows)", () => {
    render(
      <Harness
        initial={{
          chairId: "chair-a",
          deskId: "desk-a",
          quantities: {},
          monitorSlots: ["MONA1B2C3D4E", "MONA1B2C3D4E"],
        }}
      >
        <SummaryView catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.getAllByText("Qty: 1")).toHaveLength(2); // chair + desk
    expect(screen.getByText("Qty: 2")).toBeInTheDocument();
    // 450.000 + 800.000 + 2 × 300.000 = 1.850.000
    expect(screen.getByText(/Rp 1\.850\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Delivery & Setup|Grand Total/i)).not.toBeInTheDocument();
  });

  it("shows the empty state when the cart has nothing (N1)", () => {
    render(
      <Harness initial={{ chairId: null, deskId: null, quantities: {}, monitorSlots: [] }}>
        <SummaryView catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText("Your workspace is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start building" })).toHaveAttribute(
      "href",
      "/builder",
    );
  });

  it("disables Rent until a valid delivery location is entered (G3)", () => {
    render(
      <Harness>
        <SummaryView catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("button", { name: /Rent This Setup/i })).toBeDisabled();
  });
});
