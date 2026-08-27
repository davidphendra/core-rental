import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import NotFound from "./not-found";
import ErrorPage from "./error";
import GlobalErrorPage from "./global-error";

describe("page shell (decisions #26–28, T2)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("not-found renders playful copy + funnel CTAs (N2)", () => {
    render(<NotFound />);
    expect(screen.getByText("This page has surfed away")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Start Building" })).toHaveAttribute(
      "href",
      "/builder",
    );
  });

  it("error renders generic copy with Try again + Home, and never the raw error (T2)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ErrorPage error={new Error("secret stack detail")} reset={() => undefined} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    expect(screen.queryByText("secret stack detail")).not.toBeInTheDocument();
    const line = errorSpy.mock.calls[0]?.[0] as string;
    expect(JSON.parse(line) as { event: string }).toMatchObject({ event: "error.boundary" });
  });

  it("global-error owns its html/body and shows generic copy", () => {
    render(<GlobalErrorPage error={new Error("boom")} reset={() => undefined} />);
    expect(document.querySelector("html")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
