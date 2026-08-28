import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { SelectionPanel } from "./SelectionPanel";

const catalog: Product[] = [
  {
    id: "chair-a",
    name: "Uluwatu Chair",
    category: "chair",
    pricePerMonth: 450_000,
    description: "d",
    image: "/c1.svg",
  },
  {
    id: "chair-b",
    name: "Canggu Task",
    category: "chair",
    pricePerMonth: 600_000,
    description: "d",
    image: "/c2.svg",
  },
  {
    id: "desk-a",
    name: "Seminyak Desk",
    category: "desk",
    pricePerMonth: 800_000,
    description: "d",
    image: "/d.svg",
  },
  {
    id: "accessory-monitor-m1",
    name: "Monitor 1",
    category: "accessory",
    pricePerMonth: 300_000,
    description: "d",
    image: "/m1.svg",
  },
  {
    id: "accessory-coffee-c1",
    name: "Espresso",
    category: "accessory",
    pricePerMonth: 750_000,
    description: "d",
    image: "/c.svg",
  },
  {
    id: "accessory-beanbag-b1",
    name: "Bean Bag",
    category: "accessory",
    pricePerMonth: 350_000,
    description: "d",
    image: "/b.svg",
  },
  {
    id: "extra-surfboard-rack",
    name: "Surfboard Rack",
    category: "extra",
    pricePerMonth: 150_000,
    description: "d",
    image: "/s.svg",
  },
];

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("SelectionPanel (decisions #10, #20, #22, #33)", () => {
  it("filters chairs on the Chairs tab (default)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.getByText("Canggu Task")).toBeInTheDocument();
    expect(screen.queryByText("Seminyak Desk")).not.toBeInTheDocument();
  });

  function clickNth(role: string, name: string, index: number): void {
    const buttons = screen.getAllByRole(role, { name });
    const button = buttons[index];
    if (button === undefined) {
      throw new Error(`Expected ${name} button at index ${index}`);
    }
    fireEvent.click(button);
  }

  it("selecting a chair replaces the previous selection (exclusivity, N5)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    clickNth("button", "Select", 0);
    expect(screen.getByRole("button", { name: "Selected" })).toBeInTheDocument();
    clickNth("button", "Select", 0);
    // Exclusivity: exactly one Selected at a time (N5).
    expect(screen.getAllByRole("button", { name: "Selected" })).toHaveLength(1);
  });

  it("has only chair/desk/accessory tabs (extras are managed on the canvas zones)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: "Extras" })).not.toBeInTheDocument();
    // Zone products are no longer listed in the panel.
    expect(screen.queryByText("Espresso")).not.toBeInTheDocument();
    expect(screen.queryByText("Bean Bag")).not.toBeInTheDocument();
  });

  it("Accessories tab groups by subtype and provides steppers", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const monitorGroup = screen.getByText("monitor").closest("div") as HTMLElement;
    expect(within(monitorGroup).getByText("Monitor 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Monitor 1" })).toBeInTheDocument();
  });
});
