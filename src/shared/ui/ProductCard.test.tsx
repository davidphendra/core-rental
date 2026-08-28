import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import { FALLBACK_IMAGE, ProductCard } from "./ProductCard";

const product: Product = {
  id: "chair-1",
  name: "Uluwatu Chair",
  category: "chair",
  pricePerMonth: 450_000,
  description: "Mesh ergonomic chair.",
  image: "https://lh3.googleusercontent.com/aida-public/example",
};

describe("ProductCard (decision #19, #31)", () => {
  it("renders name, price, and description", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.getByText(/Rp 450\.000/)).toBeInTheDocument();
    expect(screen.getByText("/mo")).toBeInTheDocument();
    expect(screen.getByText("Mesh ergonomic chair.")).toBeInTheDocument();
  });

  it("swaps to the fallback image on error (N7 path)", async () => {
    render(<ProductCard product={product} />);
    const img = screen.getByRole("img", { name: "Uluwatu Chair" }) as HTMLImageElement;
    fireEvent.error(img);
    await waitFor(() => expect(img.src).toContain(FALLBACK_IMAGE));
  });

  it("renders children (action slot)", () => {
    render(
      <ProductCard product={product}>
        <button type="button">Add to Setup</button>
      </ProductCard>,
    );
    expect(screen.getByRole("button", { name: "Add to Setup" })).toBeInTheDocument();
  });

  it("compact variant renders the builder tile: small name, small price, no description", () => {
    render(<ProductCard product={product} variant="compact" />);
    expect(screen.getByRole("heading", { name: "Uluwatu Chair" })).toBeInTheDocument();
    expect(screen.getByText(/Rp 450\.000/)).toBeInTheDocument();
    expect(screen.queryByText("Mesh ergonomic chair.")).not.toBeInTheDocument();
  });
});
