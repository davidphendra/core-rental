"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { Product } from "../types/product";
import { PriceTag } from "./PriceTag";

export const FALLBACK_IMAGE = "/fallback/product.svg";

interface ProductCardProps {
  product: Product;
  children?: ReactNode;
  selected?: boolean;
  /** Optional overlay centered on the image (store partner pill). */
  imageBadge?: ReactNode;
  /**
   * "full" — large store card (bali_essentials_store mockup).
   * "compact" — builder panel tile (interactive_builder mockup: h-24 image,
   * label-sm name, 10px price, no description).
   */
  variant?: "full" | "compact";
}

/**
 * Product card used by the builder panel and store grid (DRY, decision #19).
 * The builder panel uses the compact tile from the interactive_builder mockup
 * (small image, tiny price, no description); the store uses the large card.
 * Uses a plain <img> to match the mockups and keep the N7 fallback path simple.
 * onError swaps to the local fallback asset (decision #31).
 */
export function ProductCard({
  product,
  children,
  selected = false,
  imageBadge,
  variant = "full",
}: ProductCardProps) {
  const [imageSrc, setImageSrc] = useState(product.image);
  const compact = variant === "compact";

  return (
    <article
      className={`tropical-card group flex flex-col rounded-xl border ${
        compact ? "bg-surface-container-lowest p-3" : "bg-surface-container-lowest p-stack-md"
      } ${selected ? "border-primary ring-primary/30 ring-2" : "border-surface-variant"}`}
    >
      <div
        className={`bg-surface-container-low relative w-full overflow-hidden rounded-lg ${
          compact ? "mb-2 h-24" : "mb-3 h-48"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- mockups use <img>; keeps N7 fallback testable */}
        <img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageSrc(FALLBACK_IMAGE)}
        />
        {imageBadge !== undefined ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">{imageBadge}</div>
        ) : null}
      </div>
      {compact ? (
        <div>
          <h4 className="text-label-sm font-label-sm text-on-surface font-bold">{product.name}</h4>
          <PriceTag
            amount={product.pricePerMonth}
            suffix="/mo"
            className="text-on-surface-variant mt-1 text-[10px]"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <h3 className="text-headline-md font-headline-md text-on-surface">{product.name}</h3>
            <PriceTag
              amount={product.pricePerMonth}
              suffix="/mo"
              className="text-headline-md font-headline-md text-primary ml-auto"
              suffixClassName="text-label-md font-label-md text-on-surface-variant"
            />
          </div>
          <p className="text-body-md text-on-surface-variant mt-1 flex-1">{product.description}</p>
        </>
      )}
      {children !== undefined ? <div className={compact ? "mt-2" : "mt-3"}>{children}</div> : null}
    </article>
  );
}
