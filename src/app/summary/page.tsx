"use client";

import { useState } from "react";

import { useProducts } from "@/shared/data/useProducts";
import { logger, logDeliverySubmitted } from "@/shared/observability/logger";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { CartProvider } from "@/shared/state/CartProvider";
import { BottomNav } from "@/shared/ui/BottomNav";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingSkeleton } from "@/shared/ui/LoadingSkeleton";
import { SiteHeader } from "@/shared/ui/SiteHeader";
import type { Product } from "@/shared/types/product";

import { ConfirmationScreen, SummaryView } from "@/features/summary";

export function SummaryContent({ catalog }: { catalog: readonly Product[] }) {
  const [confirmed, setConfirmed] = useState(false);
  const { state } = useBuilderStore();

  const onRent = () => {
    const delivery = state.deliveryLocation ?? "";
    const itemCount =
      1 +
      (state.chairId !== null ? 1 : 0) +
      Object.values(state.quantities).reduce((a, b) => a + b, 0);
    logger.info("rent.clicked", { items: itemCount });
    logDeliverySubmitted(delivery.trim().length > 0, delivery.trim().length);
    setConfirmed(true);
  };

  return confirmed ? (
    <ConfirmationScreen catalog={catalog} />
  ) : (
    <SummaryView catalog={catalog} onRent={onRent} />
  );
}

function SummaryPageInner() {
  const { data, isPending, isError, refetch } = useProducts();

  if (isPending) {
    return (
      <div className="p-6">
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="We couldn't load the summary." onRetry={() => void refetch()} />;
  }

  return (
    <CartProvider catalog={data ?? []}>
      <SummaryContent catalog={data ?? []} />
    </CartProvider>
  );
}

export default function SummaryPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <SiteHeader />
      <main className="max-w-container-max mx-auto w-full px-4 py-8 pb-32 md:px-10">
        <header className="mb-8">
          <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface md:text-headline-lg md:font-headline-lg">
            Review Your Workspace
          </h1>
          <p className="text-on-surface-variant">
            Confirm your setup details and schedule delivery.
          </p>
        </header>
        <SummaryPageInner />
      </main>
      <BottomNav />
    </div>
  );
}
