"use client";

import Link from "next/link";

import { PriceTag } from "@/shared/ui/PriceTag";

interface StickySummaryBarProps {
  total: number;
}

/** Sticky monthly total bar (mockup): live IDR total + View Setup Summary CTA. */
export function StickySummaryBar({ total }: StickySummaryBarProps) {
  return (
    <div className="border-surface-container-highest bg-surface-bright shadow-ambient fixed bottom-8 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-6 rounded-full border px-6 py-3 lg:flex">
      <div className="flex flex-col">
        <span className="text-outline text-[10px] font-bold uppercase tracking-wider">
          Monthly Total
        </span>
        <PriceTag
          amount={total}
          suffix="/mo"
          className="text-headline-md font-headline-md text-on-surface font-bold"
        />
      </div>
      <div className="bg-surface-container-highest h-8 w-px" aria-hidden="true" />
      <Link
        href="/summary"
        className="bg-tertiary-container text-on-tertiary-container focus-visible:outline-primary rounded-full px-6 py-2 font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        View Setup Summary
      </Link>
    </div>
  );
}
