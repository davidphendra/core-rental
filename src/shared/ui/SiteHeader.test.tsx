import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";
import { EMPTY_SETUP } from "@/shared/state/BuilderStore";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { SiteHeader } from "./SiteHeader";

function CartHarness({ children }: { children: ReactNode }) {
  const [state, dispatch] = useBuilderReducer(EMPTY_SETUP);
  return <BuilderStoreProvider value={{ state, dispatch }}>{children}</BuilderStoreProvider>;
}

describe("SiteHeader (bag icon validity, UX ruling)", () => {
  it("keeps the bag enabled outside the cart provider (home/store pages)", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "View your setup" })).toBeInTheDocument();
  });

  it("disables the bag when no chair/desk is selected", () => {
    render(
      <CartHarness>
        <SiteHeader />
      </CartHarness>,
    );
    expect(screen.queryByRole("link", { name: "View your setup" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("View your setup")).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the bag once both a chair and desk are selected", () => {
    function Seated() {
      const [state, dispatch] = useBuilderReducer({
        ...EMPTY_SETUP,
        chairId: "chair-a",
        deskId: "desk-a",
      });
      return (
        <BuilderStoreProvider value={{ state, dispatch }}>
          <SiteHeader />
        </BuilderStoreProvider>
      );
    }
    render(<Seated />);
    expect(screen.getByRole("link", { name: "View your setup" })).toBeInTheDocument();
  });
});
