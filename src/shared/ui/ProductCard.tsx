"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { Product } from "../types/product";
import { PriceTag } from "./PriceTag";

export const FALLBACK_IMAGE = "/fallback/product.svg";

/**
 * Product card used by the builder panel and store grid (DRY, decision #19).
 * Uses a plain <img> to match the mockups and keep the N7 fallback path simple.
 * onError swaps to the local fallback asset (decision #31).
 */
export function ProductCard({ product, children }: { product: Product; children?: ReactNode }) {
  const [imageSrc, setImageSrc] = useState(product.image);

  return (
    <article className="border-surface-variant bg-surface-container-lowest p-stack-md tropical-card flex flex-col rounded-xl border">
      <div className="bg-surface-container-low relative mb-3 h-48 w-full overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- mockups use <img>; keeps N7 fallback testable */}
        <img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageSrc(FALLBACK_IMAGE)}
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-headline-md font-headline-md text-on-surface">{product.name}</h3>
        <PriceTag
          amount={product.pricePerMonth}
          suffix="/mo"
          className="text-headline-md font-headline-md text-primary"
        />
      </div>
      <p className="text-body-md text-on-surface-variant mt-1 flex-1">{product.description}</p>
      {children !== undefined ? <div className="mt-3">{children}</div> : null}
    </article>
  );
}
