"use client";

import { useProducts } from "@/shared/data/useProducts";
import { CartProvider } from "@/shared/state/CartProvider";
import { BottomNav } from "@/shared/ui/BottomNav";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingSkeleton } from "@/shared/ui/LoadingSkeleton";
import { SiteHeader } from "@/shared/ui/SiteHeader";
import type { Product } from "@/shared/types/product";

import { StoreGrid } from "@/features/store";

function StoreContent({ catalog }: { catalog: readonly Product[] }) {
  return (
    <main className="max-w-container-max mx-auto w-full px-4 py-8 pb-32 md:px-10">
      <nav
        aria-label="Breadcrumb"
        className="text-label-md text-on-surface-variant mb-6 flex items-center gap-2"
      >
        <span>Builder</span>
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          chevron_right
        </span>
        <span className="text-primary font-bold">Store</span>
      </nav>
      <header className="mb-8">
        <h1 className="text-display-lg font-display-lg text-on-surface">Add Your Bali Vibes</h1>
        <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Elevate your workspace with premium extras. Enhance productivity and comfort with our
          curated selection.
        </p>
      </header>
      <StoreGrid catalog={catalog} />
    </main>
  );
}

function StorePageInner() {
  const { data, isPending, isError, refetch } = useProducts();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-80" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="We couldn't load the store." onRetry={() => void refetch()} />;
  }

  return (
    <CartProvider catalog={data ?? []}>
      <StoreContent catalog={data ?? []} />
    </CartProvider>
  );
}

export default function StorePage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <SiteHeader />
      <StorePageInner />
      <BottomNav />
    </div>
  );
}
