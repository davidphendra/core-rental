import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { CartProvider } from "@/shared/state/CartProvider";
import { STORAGE_KEY } from "@/shared/state/useLocalStorage";

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
    skuNo: "accessory-monitor-m1",
    name: "Monitor 1",
    category: "accessory",
    pricePerMonth: 300_000,
    description: "d",
    image: "/m.svg",
  },
];

function Probe() {
  const { state } = useBuilderStore();
  return (
    <span data-testid="probe">{`${state.chairId ?? "none"}|${Object.keys(state.quantities).join(",")}`}</span>
  );
}

function Harness({ children }: { children?: ReactNode }) {
  return (
    <CartProvider catalog={catalog}>
      <Probe />
      {children}
    </CartProvider>
  );
}

describe("Builder persistence (decisions #11, G1, N10 path)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hydrates a valid stored setup after mount", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        chairId: "chair-a",
        deskId: "desk-a",
        quantities: { "accessory-monitor-m1": 2 },
      }),
    );
    render(<Harness />);
    await waitFor(() =>
      expect(screen.getByTestId("probe").textContent).toBe("chair-a|accessory-monitor-m1"),
    );
  });

  it("starts empty when nothing is stored (builder applies D1 defaults)", async () => {
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("none|"));
  });

  it("falls back to empty on corrupt storage (G1, N10 path)", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chairId: "ghost", deskId: null, quantities: { nope: 99 } }),
    );
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("none|"));
  });

  it("falls back to empty on unparseable storage", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("none|"));
  });
});
