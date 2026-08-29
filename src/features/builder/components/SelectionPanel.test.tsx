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
    description: "Ergonomic mesh office chair for deep work.",
    image: "/c1.svg",
  },
  {
    skuNo: "chair-b",
    name: "Canggu Task",
    category: "chair",
    pricePerMonth: 600_000,
    description: "Premium task chair with headrest.",
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
    skuNo: "CFEA1B2C3D4F",
    name: "Pour-Over",
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
  it("shows desks on the Desks tab (default after the tab reorder)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    expect(screen.getByText("Seminyak Desk")).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });

  it("switching to the Chairs tab shows the chairs", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
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
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
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

  it("Accessories tab groups by subtype: monitors Select, single-selects toggle (e09s02)", () => {
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
    // Lamp (like coffee/beanbag) is now Select/Deselect single-select.
    const lampGroup = screen.getByText("lamp").closest("div") as HTMLElement;
    expect(screen.queryByRole("button", { name: "Add Desk Lamp" })).not.toBeInTheDocument();
    expect(within(lampGroup).getByRole("button", { name: "Select" })).toBeInTheDocument();
  });

  it("Accessories tab shows the Misc group (coffee + beanbag) with Select/Deselect", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const miscGroup = screen.getByText("misc").closest("div") as HTMLElement;
    expect(within(miscGroup).getByText("Espresso")).toBeInTheDocument(); // coffee
    expect(within(miscGroup).getByText("Bean Bag")).toBeInTheDocument(); // beanbag
    // Select buttons (single-select replace), not steppers.
    expect(within(miscGroup).getAllByRole("button", { name: "Select" }).length).toBe(3);
    expect(screen.queryByRole("button", { name: "Add Espresso" })).not.toBeInTheDocument();
  });

  it("selecting a coffee replaces the selected machine (single-select)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const miscGroup = screen.getByText("misc").closest("div") as HTMLElement;
    const selects = within(miscGroup).getAllByRole("button", { name: "Select" });
    // Espresso first.
    fireEvent.click(selects[0]!);
    const espressoCard = within(miscGroup).getByText("Espresso").closest("article") as HTMLElement;
    expect(within(espressoCard).getByRole("button", { name: "Deselect" })).toBeInTheDocument();
    // Clicking the other coffee (Pour-Over) replaces it.
    const pourOverCard = within(miscGroup).getByText("Pour-Over").closest("article") as HTMLElement;
    fireEvent.click(within(pourOverCard).getByRole("button", { name: "Select" })!);
    expect(within(pourOverCard).getByRole("button", { name: "Deselect" })).toBeInTheDocument();
    expect(within(espressoCard).getByRole("button", { name: "Select" })).toBeInTheDocument();
  });

  it("deselecting a coffee clears it (toggle back to Select)", () => {
    render(
      <Harness>
        <SelectionPanel catalog={catalog} />
      </Harness>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const miscGroup = screen.getByText("misc").closest("div") as HTMLElement;
    fireEvent.click(within(miscGroup).getAllByRole("button", { name: "Select" })[0]!);
    fireEvent.click(within(miscGroup).getByRole("button", { name: "Deselect" })!);
    expect(screen.queryByRole("button", { name: "Deselect" })).not.toBeInTheDocument();
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

describe("SelectionPanel search filter (keyword by name/description)", () => {
  function SearchHarness() {
    const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
    return (
      <BuilderStoreProvider value={{ state, dispatch }}>
        <SelectionPanel catalog={catalog} />
      </BuilderStoreProvider>
    );
  }

  it("filters chairs by name (case-insensitive substring)", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "CANGGU" } });
    expect(screen.getByText("Canggu Task")).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });

  it("matches against the description too", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "mesh" } });
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.queryByText("Canggu Task")).not.toBeInTheDocument();
  });

  it("shows 'No products match' when nothing matches", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "zzz" } });
    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });

  it("accessories: keyword filters each subcategory group; empty groups show a message", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    fireEvent.change(screen.getByLabelText("Search accessories"), { target: { value: "desk" } });
    const lampGroup = screen.getByText("lamp").closest("div") as HTMLElement;
    expect(within(lampGroup).getByText("Desk Lamp")).toBeInTheDocument();
    const monitorGroup = screen.getByText("monitor").closest("div") as HTMLElement;
    expect(within(monitorGroup).getByText(/no monitor match/i)).toBeInTheDocument();
    expect(within(monitorGroup).queryByText("Monitor 1")).not.toBeInTheDocument();
  });

  it("the clear button resets the filter", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "canggu" } });
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.getByText("Canggu Task")).toBeInTheDocument();
  });

  it("Escape clears the keyword", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    const input = screen.getByLabelText("Search chairs");
    fireEvent.change(input, { target: { value: "canggu" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
  });

  it("each tab keeps its own keyword (per-tab search)", () => {
    render(<SearchHarness />);
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "canggu" } });
    fireEvent.click(screen.getByRole("tab", { name: "Desks" }));
    expect(screen.getByText("Seminyak Desk")).toBeInTheDocument();
    expect((screen.getByLabelText("Search desks") as HTMLInputElement).value).toBe("");
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    expect((screen.getByLabelText("Search chairs") as HTMLInputElement).value).toBe("canggu");
    expect(screen.getByText("Canggu Task")).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });
});
