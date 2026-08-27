import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { StoreCard } from "./StoreCard";

const chair: Product = {
  id: "chair-a",
  name: "Uluwatu Chair",
  category: "chair",
  pricePerMonth: 450_000,
  description: "d",
  image: "/c.svg",
};
const monitor: Product = {
  id: "accessory-monitor-m1",
  name: "Monitor 1",
  category: "accessory",
  pricePerMonth: 300_000,
  description: "d",
  image: "/m.svg",
};
const surfboard: Product = {
  id: "extra-surfboard-rack",
  name: "Surfboard Rack",
  category: "extra",
  pricePerMonth: 150_000,
  description: "d",
  image: "/s.svg",
};
const motorcycle: Product = {
  id: "partner-moto",
  name: "Motorcycle Rental",
  category: "partner",
  pricePerMonth: 1_500_000,
  description: "d",
  image: "/x.svg",
};

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("StoreCard (decisions #20, #22, N3)", () => {
  it("adds an accessory to the cart", () => {
    render(
      <Harness>
        <StoreCard product={monitor} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Monitor 1 to setup" }));
    expect(screen.getByRole("button", { name: "Add Monitor 1 to setup" })).toHaveTextContent(
      "Added",
    );
  });

  it("adds the surfboard extra as a standard line item (#20)", () => {
    render(
      <Harness>
        <StoreCard product={surfboard} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Surfboard Rack to setup" }));
    expect(screen.getByRole("button", { name: "Add Surfboard Rack to setup" })).toHaveTextContent(
      "Added",
    );
  });

  it("selects a chair via the store (exclusivity path)", () => {
    render(
      <Harness>
        <StoreCard product={chair} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Uluwatu Chair to setup" }));
    expect(screen.getByRole("button", { name: "Add Uluwatu Chair to setup" })).toHaveTextContent(
      "Added",
    );
  });

  it("disables the add button at cap (N3)", () => {
    function AtCap() {
      const [state, dispatch] = useBuilderReducer({
        chairId: null,
        deskId: null,
        quantities: { "accessory-monitor-m1": 3 },
      });
      return (
        <BuilderStoreProvider value={{ state, dispatch }}>
          <StoreCard product={monitor} />
        </BuilderStoreProvider>
      );
    }
    render(<AtCap />);
    expect(screen.getByRole("button", { name: "Add Monitor 1 to setup" })).toBeDisabled();
  });

  it("renders Request Rental for partner items and never Add to Setup (N6)", () => {
    const onRequest = (p: Product) => void p;
    render(
      <Harness>
        <StoreCard product={motorcycle} onRequestPartner={onRequest} />
      </Harness>,
    );
    expect(
      screen.getByRole("button", { name: "Request rental for Motorcycle Rental" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Add to Setup")).not.toBeInTheDocument();
  });
});
