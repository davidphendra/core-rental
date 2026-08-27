import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import {
  BuilderStoreProvider,
  useBuilderReducer,
  useBuilderStore,
} from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { PartnerRequestModal } from "./PartnerRequestModal";

const motorcycle: Product = {
  id: "partner-moto",
  name: "Motorcycle Rental",
  category: "partner",
  pricePerMonth: 1_500_000,
  description: "Your ticket to weekend adventures.",
  image: "/x.svg",
};

function Probe() {
  const { state } = useBuilderStore();
  return (
    <span data-testid="cart">{`${state.chairId ?? "none"}|${Object.keys(state.quantities).length}`}</span>
  );
}

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return (
    <BuilderStoreProvider value={{ state, dispatch }}>
      <Probe />
      {children}
    </BuilderStoreProvider>
  );
}

describe("PartnerRequestModal (decision #20, C2, N6)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens in confirm phase with product details and Partner Service badge", () => {
    render(
      <Harness>
        <PartnerRequestModal product={motorcycle} onClose={() => undefined} />
      </Harness>,
    );
    expect(screen.getByRole("dialog", { name: "Motorcycle Rental" })).toBeInTheDocument();
    expect(screen.getByText("Partner Service")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Rental" })).toBeInTheDocument();
  });

  it("confirms in place with demo-honest copy and logs partner.requested (O2)", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    render(
      <Harness>
        <PartnerRequestModal product={motorcycle} onClose={() => undefined} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Request Rental" }));
    expect(screen.getByText("Request received")).toBeInTheDocument();
    expect(screen.queryByText("Stripe")).not.toBeInTheDocument();
    const line = infoSpy.mock.calls[0]?.[0] as string;
    expect(JSON.parse(line) as { event: string }).toMatchObject({ event: "partner.requested" });
  });

  it("never mutates the cart (N6 structural exclusion)", () => {
    render(
      <Harness>
        <PartnerRequestModal product={motorcycle} onClose={() => undefined} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Request Rental" }));
    expect(screen.getByTestId("cart").textContent).toBe("none|0");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <Harness>
        <PartnerRequestModal product={motorcycle} onClose={onClose} />
      </Harness>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
