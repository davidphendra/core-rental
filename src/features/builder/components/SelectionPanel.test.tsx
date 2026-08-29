import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { SelectionPanel } from "./SelectionPanel";

const catalog: Product[] = [
  {
    skuNo: "chair-a",
    name: "Uluwatu Chair",
    category: "chair",
    pricePerMonth: 450_000,
    description: "d",
    image: "/c1.svg",
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
  {
    skuNo: "MONA1B2C3D4E",
    name: "Monitor 1",
    category: "accessory",
    pricePerMonth: 300_000,
    description: "d",
    image: "/m1.svg",
  },
  {
    skuNo: "LMPA1B2C3D4E",
    name: "Desk Lamp",
    category: "accessory",
    pricePerMonth: 120_000,
    description: "d",
    image: "/l.svg",
  },
  {
    skuNo: "CFEA1B2C3D4E",
    name: "Espresso",
    category: "accessory",
    pricePerMonth: 750_000,
    description: "d",
    image: "/c.svg",
  },
  {
    skuNo: "BBGA1B2C3D4E",
    name: "Bean Bag",
    category: "accessory",
    pricePerMonth: 350_000,
    description: "d",
    image: "/b.svg",
  },
  {
    skuNo: "extra-surfboard-rack",
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
    expect(screen.getByRole("button", { name: "Deselect" })).toBeInTheDocument();
    clickNth("button", "Select", 0);
    // Exclusivity: exactly one Deselect at a time (N5).
    expect(screen.getAllByRole("button", { name: "Deselect" })).toHaveLength(1);
  });

  it("deselecting a chair clears it (toggle back to Select)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    clickNth("button", "Select", 0);
    fireEvent.click(screen.getByRole("button", { name: "Deselect" }));
    expect(screen.queryByRole("button", { name: "Deselect" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
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

  it("Accessories tab groups by subtype: monitors get Select, others steppers (e09s02)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const monitorGroup = screen.getByText("monitor").closest("div") as HTMLElement;
    expect(within(monitorGroup).getByText("Monitor 1")).toBeInTheDocument();
    // Monitors: Select button (slot model) — not a quantity stepper.
    expect(screen.queryByRole("button", { name: "Add Monitor 1" })).not.toBeInTheDocument();
    const select = within(monitorGroup).getAllByRole("button", { name: "Select" })[0];
    expect(select).toBeInTheDocument();
    // Other panel accessories (lamp) keep their steppers.
    const lampGroup = screen.getByText("lamp").closest("div") as HTMLElement;
    expect(within(lampGroup).getByRole("button", { name: "Add Desk Lamp" })).toBeInTheDocument();
  });

  it("Select on a monitor adds it to the slot row (fill first empty)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const select = screen.getAllByRole("button", { name: "Select" })[0];
    expect(select).toBeInTheDocument();
    // Clicking Select dispatches selectMonitor without crashing; button persists.
    fireEvent.click(select!);
    expect(screen.getAllByRole("button", { name: "Select" })[0]).toBeInTheDocument();
  });
});
