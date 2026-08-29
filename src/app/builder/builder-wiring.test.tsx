import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Product } from "@/shared/types/product";

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
    skuNo: "chair-b",
    name: "Canggu Task",
    category: "chair",
    pricePerMonth: 600_000,
    description: "d",
    image: "/c2.svg",
  },
  {
    skuNo: "desk-a",
    name: "Seminyak Desk",
    category: "desk",
    pricePerMonth: 800_000,
    description: "d",
    image: "/d.svg",
  },
];

vi.mock("@/shared/data/useProducts", () => ({
  useProducts: () => ({
    data: catalog,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

// Import after the mock so the module under test sees it.
import { BuilderContent } from "@/app/builder/page";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { CartProvider } from "@/shared/state/CartProvider";
import type { ReactNode } from "react";

function Probe() {
  const { state } = useBuilderStore();
  return <span data-testid="probe">{`${state.chairId ?? "none"}|${state.deskId ?? "none"}`}</span>;
}

function Harness({ children }: { children: ReactNode }) {
  return (
    <CartProvider catalog={catalog}>
      <Probe />
      {children}
    </CartProvider>
  );
}

describe("Builder wiring — D1 defaults (decisions D1, #25)", () => {
  it("pre-selects the first chair and first desk on a fresh cart", async () => {
    render(
      <Harness>
        <BuilderContent catalog={catalog} />
      </Harness>,
    );
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("chair-a|desk-a"));
  });

  it("renders the builder UI with the catalog", async () => {
    render(
      <Harness>
        <BuilderContent catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByRole("heading", { name: "Design Your Workspace!" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { name: "Seminyak Desk" }).length).toBeGreaterThan(0),
    );
  });
});
