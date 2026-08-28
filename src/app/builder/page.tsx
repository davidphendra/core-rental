"use client";

import { useEffect, useRef } from "react";

import { defaultsIfEmpty } from "@/shared/domain/setupRules";
import { useProducts } from "@/shared/data/useProducts";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { CartProvider, useCartTotals } from "@/shared/state/CartProvider";
import { BottomNav } from "@/shared/ui/BottomNav";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingSkeleton } from "@/shared/ui/LoadingSkeleton";
import { SiteHeader } from "@/shared/ui/SiteHeader";
import type { Product } from "@/shared/types/product";

import { BuilderCanvas, SelectionPanel, StickySummaryBar } from "@/features/builder";

/** Builder UI (e05s03): renders the canvas + panel + sticky total for a catalog. */
export function BuilderContent({ catalog }: { catalog: readonly Product[] }) {
  const { state, dispatch } = useBuilderStore();
  const { total } = useCartTotals(catalog);

  // D1: pre-select the first chair + first desk on a fresh (empty) cart.
  // Applied ONCE per mount so deliberate removal is never undone by the
  // defaults (they only seed a fresh cart, not re-seed user edits).
  const defaultsApplied = useRef(false);
  useEffect(() => {
    if (defaultsApplied.current) {
      return;
    }
    const defaults = defaultsIfEmpty(state, catalog);
    if (defaults !== null) {
      defaultsApplied.current = true;
      dispatch({ type: "hydrate", state: { ...state, ...defaults } });
    }
  }, [state, catalog, dispatch]);

  return (
    <>
      <div className="max-w-container-max mx-auto flex w-full gap-6 px-4 pb-32 pt-6 md:px-10 lg:pb-16">
        <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-80 flex-col lg:flex">
          <SelectionPanel catalog={catalog} />
        </aside>
        <main className="flex-1">
          <div className="mb-10 text-center">
            <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-primary md:text-display-lg md:font-display-lg">
              Design Your Workspace!
            </h1>
            <p className="text-body-lg font-body-lg text-outline">Create Your Perfect Setup</p>
          </div>
          <BuilderCanvas catalog={catalog} />
          <div className="mt-8 lg:hidden">
            <SelectionPanel catalog={catalog} />
          </div>
        </main>
      </div>
      <StickySummaryBar total={total} />
    </>
  );
}

function BuilderPageInner() {
  const { data, isPending, isError, refetch } = useProducts();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="We couldn't load the catalog." onRetry={() => void refetch()} />;
  }

  return (
    <CartProvider catalog={data ?? []}>
      <BuilderContent catalog={data ?? []} />
    </CartProvider>
  );
}

export default function BuilderPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <SiteHeader />
      <BuilderPageInner />
      <BottomNav />
    </div>
  );
}
