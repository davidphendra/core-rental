import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { ConfirmationScreen } from "./ConfirmationScreen";

const catalog: Product[] = [
  {
    skuNo: "chair-a",
    name: "Uluwatu Chair",
    category: "chair",
    subCategory: null,
    pricePerMonth: 450_000,
    description: "d",
    image: "/c.svg",
  },
  {
    skuNo: "desk-a",
    name: "Seminyak Desk",
    category: "desk",
    subCategory: null,
    pricePerMonth: 800_000,
    description: "d",
    image: "/d.svg",
  },
  {
    skuNo: "MONA1B2C3D4E",
    name: "Monitor 1",
    category: "accessory",
    subCategory: null,
    pricePerMonth: 300_000,
    description: "d",
    image: "/m.svg",
  },
];

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer({
    chairId: "chair-a",
    deskId: "desk-a",
    quantities: {},
    monitorSlots: ["MONA1B2C3D4E", "MONA1B2C3D4E"],
    deliveryLocation: "Villa Lotus, Canggu",
  });
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("ConfirmationScreen (decisions #5, C2, C4, #37)", () => {
  it("shows the exact cart line items + total (displayed-value verification target)", () => {
    render(
      <Harness>
        <ConfirmationScreen catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText("Monitor 1")).toBeInTheDocument();
    // 450.000 + 800.000 + 2 × 300.000 = 1.850.000
    expect(screen.getByText(/Rp 1\.850\.000/)).toBeInTheDocument();
  });

  it("echoes the delivery location (C4)", () => {
    render(
      <Harness>
        <ConfirmationScreen catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText(/Villa Lotus, Canggu/)).toBeInTheDocument();
  });

  it("contains demo-honest copy with zero payment language (C2)", () => {
    render(
      <Harness>
        <ConfirmationScreen catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText(/no payment taken/i)).toBeInTheDocument();
    expect(screen.queryByText(/stripe|checkout|card number/i)).not.toBeInTheDocument();
  });
});
