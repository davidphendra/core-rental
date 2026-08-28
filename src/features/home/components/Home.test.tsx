import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Product } from "@/shared/types/product";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

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

describe("Hero (moni_s_workspace_home mockup, decision #19/#25)", () => {
  it("renders the tagline and the Tropical Tech badge", () => {
    render(<Hero catalog={catalog} />);
    expect(screen.getByText("Your Bali Office,")).toBeInTheDocument();
    expect(screen.getByText("Delivered.")).toBeInTheDocument();
    expect(screen.getByText("Tropical Tech Aesthetic")).toBeInTheDocument();
  });

  it("links the CTAs to the builder and store", () => {
    render(<Hero catalog={catalog} />);
    expect(screen.getByRole("link", { name: "Build Your Setup" })).toHaveAttribute(
      "href",
      "/builder",
    );
    expect(screen.getByRole("link", { name: "View Accessories" })).toHaveAttribute(
      "href",
      "/store",
    );
  });

  it("floating cards show real catalog products with IDR prices (#19)", () => {
    render(<Hero catalog={catalog} />);
    expect(screen.getByText("Uluwatu Chair")).toBeInTheDocument();
    expect(screen.getByText("Seminyak Desk")).toBeInTheDocument();
    expect(screen.getByText(/Rp 450\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Rp 800\.000/)).toBeInTheDocument();
  });

  it("renders no profile avatar (C5)", () => {
    const { container } = render(<Hero catalog={catalog} />);
    expect(container.querySelector('img[alt*="profile" i]')).toBeNull();
  });
});

describe("HowItWorks (decision C6)", () => {
  it("renders three steps with the rewritten step-2 copy", () => {
    render(<HowItWorks />);
    expect(screen.getByText("1. Design")).toBeInTheDocument();
    expect(screen.getByText("2. Rent")).toBeInTheDocument();
    expect(screen.getByText("3. Work")).toBeInTheDocument();
    expect(screen.getByText(/month-to-month. No long-term commitment/)).toBeInTheDocument();
  });

  it("contains no phantom duration selector (C6)", () => {
    render(<HowItWorks />);
    expect(screen.queryByText(/select your rental duration/i)).not.toBeInTheDocument();
  });
});
