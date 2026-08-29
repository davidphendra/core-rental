"use client";

import Link from "next/link";

import { useBuilderStore } from "@/shared/state/BuilderStore";
import { useCartTotals } from "@/shared/state/CartProvider";
import { PriceTag } from "@/shared/ui/PriceTag";
import type { Product } from "@/shared/types/product";

interface ConfirmationScreenProps {
  catalog: readonly Product[];
  /** Snapshot passed by SummaryContent after demo verification (C2 gate). */
  delivery?: string;
  lineItems?: { product: Product; quantity: number }[];
  total?: number;
}

/**
 * Mock confirmation (decisions #5, C2, C4): demo-honest copy — no payment
 * language — echoing the delivery location and showing exactly the cart's line
 * items + total (the E2E displayed-value verification target, #37). When the
 * summary's demo gate has cleared the cart, renders from the snapshot props.
 */
export function ConfirmationScreen({
  catalog,
  delivery,
  lineItems: receiptItems,
  total: receiptTotal,
}: ConfirmationScreenProps) {
  const { state } = useBuilderStore();
  const totals = useCartTotals(catalog);

  const items = receiptItems ?? totals.lineItems;
  const sum = receiptTotal ?? totals.total;
  const address = delivery ?? state.deliveryLocation ?? "";

  return (
    <div className="border-surface-variant bg-surface-container-lowest mx-auto w-full max-w-2xl rounded-2xl border p-8 text-center">
      <span className="material-symbols-outlined text-primary text-6xl" aria-hidden="true">
        check_circle
      </span>
      <h1 className="text-display-lg font-display-lg text-on-surface mt-2">Your request is in!</h1>
      <p className="text-body-lg text-on-surface-variant mt-3">
        We&apos;ll deliver to{" "}
        <strong className="text-on-surface whitespace-pre-line">{address}</strong>. Our team will
        reach out to confirm your setup.
      </p>

      <ul className="border-surface-variant bg-surface mt-8 rounded-xl border p-4 text-left">
        {items.map(({ product, quantity }) => (
          <li
            key={product.skuNo}
            className="border-surface-variant flex items-center justify-between border-b py-2 last:border-b-0"
          >
            <span className="text-label-md font-label-md text-on-surface">
              {product.name} <span className="text-on-surface-variant">× {quantity}</span>
            </span>
            <PriceTag
              amount={product.pricePerMonth * quantity}
              className="text-body-md text-on-surface font-semibold"
            />
          </li>
        ))}
        <li className="mt-2 flex items-center justify-between">
          <span className="text-headline-md font-headline-md text-on-surface">Monthly Total</span>
          <PriceTag
            amount={sum}
            suffix="/mo"
            className="text-headline-md font-headline-md text-primary"
          />
        </li>
      </ul>

      <p className="text-label-sm font-label-sm text-on-surface-variant mt-6">
        This is a demo — no payment taken.
      </p>
      <Link
        href="/builder"
        className="bg-primary text-on-primary hover:bg-surface-tint focus-visible:outline-primary mt-4 inline-block rounded-xl px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Back to builder
      </Link>
    </div>
  );
}
