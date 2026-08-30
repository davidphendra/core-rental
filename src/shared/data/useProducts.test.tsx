import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { Product } from "../types/product";
import { useProducts } from "./useProducts";

function wrapper({ children }: { children: ReactNode }) {
  // retry: false so the error state surfaces within the test window (default retries would delay it).
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

const CATALOG: Product[] = [
  {
    skuNo: "CHAA1B2C3D4E",
    name: "Test Chair",
    category: "chair",
    subCategory: null,
    pricePerMonth: 450_000,
    description: "d",
    image: "/x.svg",
  },
];

describe("useProducts (decision #25)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the catalog from /api/products", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(CATALOG), { status: 200 }));

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith("/api/products");
    expect(result.current.data).toEqual(CATALOG);
  });

  it("surfaces an error state on API failure (E2E N8 path)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
