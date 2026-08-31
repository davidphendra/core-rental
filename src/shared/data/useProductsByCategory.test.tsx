import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "../types/product";
import { useProductsByCategory } from "./useProductsByCategory";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

const CHAIR: Product = {
  skuNo: "CHAA1B2C3D4E",
  name: "Test Chair",
  category: "chair",
  subCategory: null,
  pricePerMonth: 450_000,
  description: "d",
  image: "/x.svg",
};

describe("useProductsByCategory (v1.14.0)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches /api/products with the category param", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([CHAIR]), { status: 200 }));
    const { result } = renderHook(() => useProductsByCategory({ category: "chair" }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/products?category=chair");
    expect(result.current.data).toEqual([CHAIR]);
  });

  it("appends q only when non-blank", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    renderHook(() => useProductsByCategory({ category: "desk", q: "bamboo" }), { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/products?category=desk&q=bamboo");
  });

  it("omits whitespace-only q", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    renderHook(() => useProductsByCategory({ category: "desk", q: "   " }), { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/products?category=desk");
  });

  it("treats each category+q as a distinct cached view", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([CHAIR]), { status: 200 }));
    const { result, rerender } = renderHook(
      ({ view }: { view: Parameters<typeof useProductsByCategory>[0] }) =>
        useProductsByCategory(view),
      {
        wrapper,
        initialProps: { view: { category: "chair" } },
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const callsForChair = fetchMock.mock.calls.length;
    rerender({ view: { category: "chair" } });
    // Same view → cached, no second fetch.
    expect(fetchMock.mock.calls.length).toBe(callsForChair);
    rerender({ view: { category: "chair", q: "ergo" } });
    await waitFor(() =>
      expect(fetchMock.mock.calls.map((c) => c[0])).toContain(
        "/api/products?category=chair&q=ergo",
      ),
    );
  });

  it("surfaces fetch failures as errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    const { result } = renderHook(() => useProductsByCategory({ category: "chair" }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("rejects an invalid payload (trust boundary)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ skuNo: "nope" }]), { status: 200 }),
    );
    const { result } = renderHook(() => useProductsByCategory({ category: "chair" }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
