import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { BuilderCanvas } from "./BuilderCanvas";

const catalog: Product[] = [
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
];

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("BuilderCanvas keyboard operability (decision #24)", () => {
  it("slots are keyboard-focusable buttons", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    const monitor = screen.getByRole("button", { name: "Add Monitor" });
    expect(monitor.tagName).toBe("BUTTON");
    monitor.focus();
    expect(monitor).toHaveFocus();
  });

  it("Enter on an empty slot adds an item", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Monitor" }), { key: "Enter" });
    expect(screen.getByRole("button", { name: "Monitor: 1" })).toBeInTheDocument();
  });

  it("Space on an empty slot adds an item", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Lamp" }), { key: " " });
    expect(screen.getByRole("button", { name: "Lamp: 1" })).toBeInTheDocument();
  });

  it("ArrowUp adds from empty and increments; ArrowDown decrements", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    // ArrowUp from empty adds 1 (stepper UX), re-query after each state change.
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Monitor" }), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Monitor: 1" }), { key: "ArrowUp" });
    expect(screen.getByRole("button", { name: "Monitor: 2" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("button", { name: "Monitor: 2" }), { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Monitor: 1" })).toBeInTheDocument();
  });

  it("ArrowDown at quantity 1 removes the item", () => {
    render(
      <Harness>
        <BuilderCanvas catalog={catalog} />
      </Harness>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Monitor" }), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Monitor: 1" }), { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Add Monitor" })).toBeInTheDocument();
  });

  it("ArrowUp respects the cap (no-op at max)", () => {
    const monitor = "accessory-monitor-m1";
    function AtCap() {
      const [state, dispatch] = useBuilderReducer({
        chairId: null,
        deskId: null,
        quantities: { [monitor]: 3 },
      });
      return (
        <BuilderStoreProvider value={{ state, dispatch }}>
          <BuilderCanvas catalog={catalog} />
        </BuilderStoreProvider>
      );
    }
    render(<AtCap />);
    const filled = screen.getByRole("button", { name: "Monitor: 3" });
    fireEvent.keyDown(filled, { key: "ArrowUp" });
    expect(screen.getByRole("button", { name: "Monitor: 3" })).toBeInTheDocument();
  });
});
