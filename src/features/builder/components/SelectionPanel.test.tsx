import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { matchesCatalogFilter } from "@/shared/domain/catalogFilter";
import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";
import { SelectionPanel } from "./SelectionPanel";
import type { CatalogView } from "@/shared/data/useProductsByCategory";

const catalog: Product[] = [
  {
    skuNo: "chair-a",
    name: "Uluwatu Chair",
    category: "chair",
    subCategory: null,
    pricePerMonth: 450_000,
    description: "Ergonomic mesh office chair for deep work.",
    image: "/c1.svg",
  },
  {
    skuNo: "chair-b",
    name: "Canggu Task",
    category: "chair",
    subCategory: null,
    pricePerMonth: 600_000,
    description: "Premium task chair with headrest.",
    image: "/c2.svg",
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
  {
    skuNo: "MONA1B2C3D4E",
    name: "Monitor 1",
    category: "accessory",
    subCategory: null,
    pricePerMonth: 300_000,
    description: "d",
    image: "/m1.svg",
  },
  {
    skuNo: "LMPA1B2C3D4E",
    name: "Desk Lamp",
    category: "accessory",
    subCategory: null,
    pricePerMonth: 120_000,
    description: "d",
    image: "/l.svg",
  },
  {
    skuNo: "CFEA1B2C3D4E",
    name: "Espresso",
    category: "accessory",
    subCategory: null,
    pricePerMonth: 750_000,
    description: "d",
    image: "/c.svg",
  },
  {
    skuNo: "CFEA1B2C3D4F",
    name: "Pour-Over",
    category: "accessory",
    subCategory: null,
    pricePerMonth: 750_000,
    description: "d",
    image: "/c.svg",
  },
  {
    skuNo: "BBGA1B2C3D4E",
    name: "Bean Bag",
    category: "accessory",
    subCategory: null,
    pricePerMonth: 350_000,
    description: "d",
    image: "/b.svg",
  },
  {
    skuNo: "extra-surfboard-rack",
    name: "Surfboard Rack",
    category: "extra",
    subCategory: null,
    pricePerMonth: 150_000,
    description: "d",
    image: "/s.svg",
  },
];

/** The v1.14.0 server contract, mimicked with the fixture: the panel renders
 * exactly what /api/products?category+&q would return. */
const viewFor = (category: string, q: string): Product[] =>
  catalog.filter((p) => matchesCatalogFilter(p, { category, q }));

const useProductsByCategoryMock = vi.fn();
const useProductsMock = vi.fn();

vi.mock("@/shared/data/useProductsByCategory", () => ({
  useProductsByCategory: (...args: unknown[]) => useProductsByCategoryMock(...args),
}));
vi.mock("@/shared/data/useProducts", () => ({
  useProducts: () => useProductsMock(),
}));

function Harness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

function renderPanel(): void {
  useProductsMock.mockReturnValue({ data: catalog });
  useProductsByCategoryMock.mockImplementation(({ category, q }: CatalogView) => ({
    data: viewFor(category, q ?? ""),
    isPending: false,
  }));
  render(
    <Harness>
      <SelectionPanel />
    </Harness>,
  );
}

/** Advance the 250ms keyword debounce. */
function flushDebounce(): void {
  act(() => {
    vi.advanceTimersByTime(250);
  });
}

describe("SelectionPanel (decisions #10, #20, #22, #33; v1.14.0 server views)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("requests the desk view on the Desks tab (default after the tab reorder)", () => {
    renderPanel();
    expect(screen.getByText("Seminyak Desk")).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
    expect(useProductsByCategoryMock).toHaveBeenCalledWith({ category: "desk", q: "" });
  });

  it("switching to the Chairs tab requests the chair view", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    expect(useProductsByCategoryMock).toHaveBeenCalledWith({ category: "chair", q: "" });
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
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    clickNth("button", "Select", 0);
    expect(screen.getByRole("button", { name: "Deselect" })).toBeInTheDocument();
    clickNth("button", "Select", 0);
    // Exclusivity: exactly one Deselect at a time (N5).
    expect(screen.getAllByRole("button", { name: "Deselect" })).toHaveLength(1);
  });

  it("deselecting a chair clears it (toggle back to Select)", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    clickNth("button", "Select", 0);
    fireEvent.click(screen.getByRole("button", { name: "Deselect" }));
    expect(screen.queryByRole("button", { name: "Deselect" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  });

  it("has only chair/desk/accessory tabs (extras are managed on the canvas zones)", () => {
    renderPanel();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: "Extras" })).not.toBeInTheDocument();
    // Zone products are not listed in the panel's default view.
    expect(screen.queryByText("Espresso")).not.toBeInTheDocument();
    expect(screen.queryByText("Bean Bag")).not.toBeInTheDocument();
  });

  it("Accessories tab groups by subtype: monitors Select, single-selects toggle (e09s02)", () => {
    renderPanel();
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
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const miscGroup = screen.getByText("misc").closest("div") as HTMLElement;
    expect(within(miscGroup).getByText("Espresso")).toBeInTheDocument(); // coffee
    expect(within(miscGroup).getByText("Bean Bag")).toBeInTheDocument(); // beanbag
    // Select buttons (single-select replace), not steppers.
    expect(within(miscGroup).getAllByRole("button", { name: "Select" }).length).toBe(3);
    expect(screen.queryByRole("button", { name: "Add Espresso" })).not.toBeInTheDocument();
  });

  it("selecting a coffee replaces the selected machine (single-select)", () => {
    renderPanel();
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
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const miscGroup = screen.getByText("misc").closest("div") as HTMLElement;
    fireEvent.click(within(miscGroup).getAllByRole("button", { name: "Select" })[0]!);
    fireEvent.click(within(miscGroup).getByRole("button", { name: "Deselect" })!);
    expect(screen.queryByRole("button", { name: "Deselect" })).not.toBeInTheDocument();
  });

  it("Select on a monitor adds it to the slot row (fill first empty)", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    const select = screen.getAllByRole("button", { name: "Select" })[0];
    expect(select).toBeInTheDocument();
    // Clicking Select dispatches selectMonitor without crashing; button persists.
    fireEvent.click(select!);
    expect(screen.getAllByRole("button", { name: "Select" })[0]).toBeInTheDocument();
  });
});

describe("SelectionPanel search (v1.14.0: server-side keyword, debounced 250ms)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("filters chairs by name (case-insensitive substring) — server view", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "CANGGU" } });
    flushDebounce();
    expect(useProductsByCategoryMock).toHaveBeenLastCalledWith({
      category: "chair",
      q: "CANGGU",
    });
    expect(screen.getByText("Canggu Task")).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });

  it("matches against the description too", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "mesh" } });
    flushDebounce();
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.queryByText("Canggu Task")).not.toBeInTheDocument();
  });

  it("shows 'No products match' when nothing matches", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "zzz" } });
    flushDebounce();
    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });

  it("accessories: keyword filters each subcategory group; empty groups show a message", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Accessories" }));
    fireEvent.change(screen.getByLabelText("Search accessories"), { target: { value: "desk" } });
    flushDebounce();
    const lampGroup = screen.getByText("lamp").closest("div") as HTMLElement;
    expect(within(lampGroup).getByText("Desk Lamp")).toBeInTheDocument();
    const monitorGroup = screen.getByText("monitor").closest("div") as HTMLElement;
    expect(within(monitorGroup).getByText(/no monitor match/i)).toBeInTheDocument();
    expect(within(monitorGroup).queryByText("Monitor 1")).not.toBeInTheDocument();
  });

  it("the clear button resets the filter to the full view", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "canggu" } });
    flushDebounce();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    flushDebounce();
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
  });

  it("shows a Searching… status while the debounce is pending", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("tab", { name: "Chairs" }));
    fireEvent.change(screen.getByLabelText("Search chairs"), { target: { value: "ergo" } });
    // Before the 250ms debounce elapses the input differs from the fetch q.
    expect(screen.getByRole("status")).toHaveTextContent("Searching…");
    flushDebounce();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
