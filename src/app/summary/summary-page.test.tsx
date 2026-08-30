import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/shared/types/product";

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
];

vi.mock("@/shared/data/useProducts", () => ({
  useProducts: () => ({ data: catalog, isPending: false, isError: false, refetch: vi.fn() }),
}));

import SummaryPage, { SummaryContent } from "@/app/summary/page";
import { CartProvider } from "@/shared/state/CartProvider";
import { STORAGE_KEY } from "@/shared/state/useLocalStorage";

describe("Rent flow (decisions #5, C2, O2)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("Rent → demo-verify modal → confirmation, logging rent.clicked + delivery.submitted (PII-free)", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chairId: "chair-a", deskId: "desk-a", quantities: {} }),
    );
    render(
      <CartProvider catalog={catalog}>
        <SummaryContent catalog={catalog} />
      </CartProvider>,
    );

    const input = screen.getByLabelText("Delivery Location");
    fireEvent.change(input, { target: { value: "Villa Lotus, Canggu" } });
    const rent = screen.getByRole("button", { name: /Rent This Setup/i });
    expect(rent).toBeEnabled();

    // Rent now opens the demo-verification dialog (C2 gate).
    fireEvent.click(rent);
    const dialog = screen.getByRole("dialog", { name: "Confirm this is a demo" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Confirmation phrase"), {
      target: { value: "this is a demo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(screen.getByText("Your request is in!")).toBeInTheDocument());
    // The order is removed after confirmation: storage holds a fresh empty
    // setup (the write-through persistence effect rewrites the reset state).
    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual({
      chairId: null,
      deskId: null,
      quantities: {},
      monitorSlots: [],
    });

    const lines = infoSpy.mock.calls.map(
      (call) => JSON.parse(call[0] as string) as { event: string },
    );
    expect(lines.map((l) => l.event)).toContain("rent.clicked");
    expect(lines.map((l) => l.event)).toContain("delivery.submitted");
    // PII-free: no delivery address in any log line.
    for (const line of lines) {
      expect(JSON.stringify(line)).not.toContain("Villa Lotus");
    }
  });

  it("cancelling the demo dialog leaves the cart and order intact", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chairId: "chair-a", deskId: "desk-a", quantities: {} }),
    );
    render(
      <CartProvider catalog={catalog}>
        <SummaryContent catalog={catalog} />
      </CartProvider>,
    );

    fireEvent.change(screen.getByLabelText("Delivery Location"), {
      target: { value: "Villa Lotus, Canggu" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rent This Setup/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("the /summary page shell renders", () => {
    // The CartProvider is global now (providers.tsx) — provide it here.
    render(
      <CartProvider catalog={catalog}>
        <SummaryPage />
      </CartProvider>,
    );
    expect(screen.getByRole("heading", { name: "Review Your Workspace" })).toBeInTheDocument();
  });
});
