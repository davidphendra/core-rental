"use client";

import { useState } from "react";

import { track } from "@vercel/analytics";

import { useProducts } from "@/shared/data/useProducts";
import { logger, logDeliverySubmitted } from "@/shared/observability/logger";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { CartProvider, useCartTotals } from "@/shared/state/CartProvider";
import { STORAGE_KEY } from "@/shared/state/useLocalStorage";
import { BottomNav } from "@/shared/ui/BottomNav";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingSkeleton } from "@/shared/ui/LoadingSkeleton";
import { SiteHeader } from "@/shared/ui/SiteHeader";
import type { Product } from "@/shared/types/product";

import { DemoVerifyModal, ConfirmationScreen, SummaryView } from "@/features/summary";

interface Receipt {
  delivery: string;
  lineItems: { product: Product; quantity: number }[];
  total: number;
}

/**
 * Summary flow with the demo-verification gate: Rent opens a dialog asking for
 * the phrase "this is a demo"; on match the receipt is snapshotted, the order
 * is cleared from localStorage + memory, and the confirmation renders from the
 * snapshot (C2 gate).
 */
export function SummaryContent({ catalog }: { catalog: readonly Product[] }) {
  const [confirmed, setConfirmed] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const { state, dispatch } = useBuilderStore();
  const { lineItems, total } = useCartTotals(catalog);

  const onVerified = () => {
    // Snapshot BEFORE clearing so the confirmation renders the paid receipt.
    setReceipt({ delivery: state.deliveryLocation ?? "", lineItems, total });
    const itemCount =
      1 +
      (state.chairId !== null ? 1 : 0) +
      Object.values(state.quantities).reduce((a, b) => a + b, 0);
    logger.info("rent.clicked", { items: itemCount });
    // Vercel Web Analytics custom event (visible under Web Analytics > Events).
    track("rent_clicked", { items: itemCount });
    const delivery = state.deliveryLocation ?? "";
    logDeliverySubmitted(delivery.trim().length > 0, delivery.trim().length);
    track("delivery_submitted", { hasAddress: delivery.trim().length > 0 });
    // Order removed: reset in-memory + drop the persisted cart (E3-guarded).
    dispatch({ type: "reset" });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // E1: targeted guard — storage removal must never break the flow.
    }
    setShowVerify(false);
    setConfirmed(true);
  };

  return confirmed ? (
    <ConfirmationScreen
      catalog={catalog}
      delivery={receipt?.delivery}
      lineItems={receipt?.lineItems}
      total={receipt?.total}
    />
  ) : (
    <>
      <SummaryView catalog={catalog} onRent={() => setShowVerify(true)} />
      {showVerify ? (
        <DemoVerifyModal onConfirm={onVerified} onClose={() => setShowVerify(false)} />
      ) : null}
    </>
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
    <div className="bg-background text-on-background">
      <SiteHeader />
      <main className="max-w-container-max mx-auto w-full px-4 py-8 pb-4 md:px-10">
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
