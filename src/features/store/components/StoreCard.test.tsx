import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Product } from "@/shared/types/product";
import { StoreCard } from "./StoreCard";

const chair: Product = {
  skuNo: "chair-a",
  name: "Uluwatu Chair",
  category: "chair",
  pricePerMonth: 450_000,
  description: "d",
  image: "/c.svg",
};
const monitor: Product = {
  skuNo: "accessory-monitor-m1",
  name: "Monitor 1",
  category: "accessory",
  pricePerMonth: 300_000,
  description: "d",
  image: "/m.svg",
};
const motorcycle: Product = {
  skuNo: "partner-moto",
  name: "Motorcycle Rental",
  category: "partner",
  pricePerMonth: 1_500_000,
  description: "d",
  image: "/x.svg",
};

describe("StoreCard (catalog gallery)", () => {
  it("renders a display-only card: name, description, price, no button", () => {
    render(<StoreCard product={chair} />);
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.getByText("d")).toBeInTheDocument();
    expect(screen.getByText(/450/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("accessories are display-only too (no Add to Setup)", () => {
    render(<StoreCard product={monitor} />);
    expect(screen.getByText("Monitor 1")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Add to Setup")).not.toBeInTheDocument();
  });

  it("partner cards show the Partner Service pill and never a button (N6)", () => {
    render(<StoreCard product={motorcycle} />);
    expect(screen.getByText("Partner Service")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Add to Setup")).not.toBeInTheDocument();
    expect(screen.queryByText("Request Rental")).not.toBeInTheDocument();
  });
});
