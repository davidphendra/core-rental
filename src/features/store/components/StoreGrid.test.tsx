import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Product } from "@/shared/types/product";
import { StoreGrid } from "./StoreGrid";

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
  {
    id: "accessory-monitor-m1",
    name: "Monitor 1",
    category: "accessory",
    pricePerMonth: 300_000,
    description: "d",
    image: "/m.svg",
  },
  {
    id: "extra-surfboard-rack",
    name: "Surfboard Rack",
    category: "extra",
    pricePerMonth: 150_000,
    description: "d",
    image: "/s.svg",
  },
  {
    id: "partner-moto",
    name: "Motorcycle Rental",
    category: "partner",
    pricePerMonth: 1_500_000,
    description: "d",
    image: "/x.svg",
  },
];

const clickTab = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));

describe("StoreGrid — category filter (decision #33)", () => {
  it("defaults to Chairs and shows only chairs", () => {
    render(<StoreGrid catalog={catalog} />);
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.queryByText("Monitor 1")).not.toBeInTheDocument();
  });

  it("switches to Accessories and shows only accessories", () => {
    render(<StoreGrid catalog={catalog} />);
    clickTab("Accessories");
    expect(screen.getByText("Monitor 1")).toBeInTheDocument();
    expect(screen.queryByText("Uluwatu Chair")).not.toBeInTheDocument();
  });

  it("Extras tab shows the surfboard AND the partner motorcycle (N6 display-only)", () => {
    render(<StoreGrid catalog={catalog} />);
    clickTab("Extras");
    expect(screen.getByText("Surfboard Rack")).toBeInTheDocument();
    expect(screen.getByText("Motorcycle Rental")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
