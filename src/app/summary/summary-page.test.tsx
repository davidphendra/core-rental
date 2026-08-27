import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/shared/types/product";

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

  it("Rent → confirmation after a valid delivery, logging rent.clicked + delivery.submitted (PII-free)", async () => {
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
    fireEvent.click(rent);

    await waitFor(() => expect(screen.getByText("Your request is in!")).toBeInTheDocument());

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

  it("the /summary page shell renders", () => {
    render(<SummaryPage />);
    expect(screen.getByRole("heading", { name: "Review Your Workspace" })).toBeInTheDocument();
  });
});
