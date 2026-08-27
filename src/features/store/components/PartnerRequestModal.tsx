"use client";

import { useEffect, useRef, useState } from "react";

import { logger } from "@/shared/observability/logger";
import { Button } from "@/shared/ui/Button";
import { PriceTag } from "@/shared/ui/PriceTag";
import type { Product } from "@/shared/types/product";

type Phase = "confirm" | "done";

interface PartnerRequestModalProps {
  product: Product;
  onClose: () => void;
}

/**
 * Partner request flow for category 'partner' items (decision #20): a
 * client-side modal with mock confirmation (C2 demo-honest copy — no payment
 * language). Never mutates the cart (structural exclusion, N6). Focused on
 * open, Esc/overlay to close (a11y, #24).
 */
export function PartnerRequestModal({ product, onClose }: PartnerRequestModalProps) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onRequest = () => {
    logger.info("partner.requested", { partnerId: product.id });
    setPhase("done");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="bg-on-surface/40 absolute inset-0" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="bg-surface relative w-full max-w-md rounded-2xl p-6 shadow-lg focus-visible:outline-none"
      >
        {phase === "confirm" ? (
          <>
            <span className="bg-surface-tint/10 text-label-sm text-tertiary-container mb-3 inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                verified
              </span>
              Partner Service
            </span>
            <div className="mb-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- partner thumbnail */}
              <img
                src={product.image}
                alt={product.name}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div>
                <h2
                  id="partner-title"
                  className="text-headline-md font-headline-md text-on-surface"
                >
                  {product.name}
                </h2>
                <PriceTag
                  amount={product.pricePerMonth}
                  suffix="/mo"
                  className="text-headline-md text-primary font-bold"
                />
              </div>
            </div>
            <p className="text-body-md text-on-surface-variant mb-2">{product.description}</p>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Rented separately from your setup — this is a partner service, not part of your
              monthly total.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="tertiary" onClick={onRequest}>
                Request Rental
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 id="partner-title" className="text-headline-md font-headline-md text-on-surface">
              Request received
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6 mt-2">
              Thanks! Our team will reach out to arrange your {product.name} rental.
            </p>
            <div className="flex justify-end">
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
