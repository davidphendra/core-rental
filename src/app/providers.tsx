"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";

import { useProducts } from "@/shared/data/useProducts";
import { CartProvider } from "@/shared/state/CartProvider";

/**
 * Global cart (UX ruling): the CartProvider now wraps the whole app —
 * including the SiteHeader — so the bag icon can disable when the cart lacks
 * both a chair and a desk. The catalog is fetched once and cached; pages still
 * fetch it independently for their own props (same TanStack query key).
 */
function GlobalCart({ children }: { children: ReactNode }) {
  const { data } = useProducts();
  return <CartProvider catalog={data ?? []}>{children}</CartProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  // useState initializer keeps one QueryClient per app instance (SSR-safe pattern).
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalCart>{children}</GlobalCart>
    </QueryClientProvider>
  );
}
