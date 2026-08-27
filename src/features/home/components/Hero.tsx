import Link from "next/link";

import { PriceTag } from "@/shared/ui/PriceTag";
import type { Product } from "@/shared/types/product";

interface HeroProps {
  catalog: readonly Product[];
}

/** Landing hero (moni_s_workspace_home mockup): tagline, badge, CTAs, catalog-driven floating cards. */
export function Hero({ catalog }: HeroProps) {
  const chair = catalog.find((p) => p.category === "chair");
  const desk = catalog.find((p) => p.category === "desk");

  return (
    <section className="bg-pattern px-margin-mobile py-section-gap md:px-margin-desktop relative overflow-hidden">
      <div className="max-w-container-max gap-gutter mx-auto grid grid-cols-1 items-center md:grid-cols-12">
        <div className="gap-stack-lg flex flex-col items-start md:col-span-6">
          <span className="bg-secondary-container text-label-md font-label-md text-on-secondary-container inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              wb_sunny
            </span>
            Tropical Tech Aesthetic
          </span>
          <h1 className="text-display-lg font-display-lg text-on-surface max-w-2xl tracking-tight md:text-[56px] md:leading-[64px]">
            Your Bali Office,
            <br />
            <span className="text-primary relative inline-block">
              Delivered.
              <svg
                className="text-primary-fixed-dim absolute -bottom-1 left-0 h-3 w-full opacity-50"
                preserveAspectRatio="none"
                viewBox="0 0 100 10"
                aria-hidden="true"
              >
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-xl">
            High-performance SaaS utility meets the vibrant energy of island life. Rent premium
            ergonomic setups designed for digital nomads.
          </p>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Link
              href="/builder"
              className="bg-primary text-on-primary hover:bg-surface-tint focus-visible:outline-primary rounded-xl px-8 py-4 text-center font-bold shadow-md transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Build Your Setup
            </Link>
            <Link
              href="/store"
              className="border-primary text-primary hover:bg-surface-container focus-visible:outline-primary rounded-xl border-2 px-8 py-4 text-center font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              View Accessories
            </Link>
          </div>
        </div>

        <div className="relative mt-10 h-[400px] md:col-span-6 md:mt-0 md:h-[600px]">
          {chair !== undefined ? (
            <div className="border-surface-container-highest bg-surface p-stack-md shadow-ambient absolute right-[10%] top-[10%] w-64 rotate-3 rounded-2xl border transition-transform duration-300 hover:rotate-0">
              <span className="bg-secondary-container text-on-secondary-container inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase">
                Ergonomic
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element -- floating card (mockup parity) */}
              <img
                src={chair.image}
                alt={chair.name}
                className="mx-auto my-4 h-40 w-full object-contain drop-shadow-md"
              />
              <h3 className="text-body-md text-on-surface font-bold">{chair.name}</h3>
              <PriceTag
                amount={chair.pricePerMonth}
                suffix=" / mo"
                className="text-label-md text-on-surface-variant"
              />
            </div>
          ) : null}
          {desk !== undefined ? (
            <div className="border-surface-container-highest bg-surface/80 p-stack-md shadow-ambient absolute bottom-[5%] left-[5%] w-72 -rotate-2 rounded-2xl border backdrop-blur-md transition-transform duration-300 hover:rotate-0">
              <span className="bg-primary-container text-on-primary-container inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase">
                Standing
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element -- floating card (mockup parity) */}
              <img
                src={desk.image}
                alt={desk.name}
                className="mx-auto my-4 h-32 w-full object-contain drop-shadow-sm"
              />
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-body-md text-on-surface font-bold">{desk.name}</h3>
                  <PriceTag
                    amount={desk.pricePerMonth}
                    suffix=" / mo"
                    className="text-label-md text-on-surface-variant"
                  />
                </div>
                <Link
                  href="/builder"
                  aria-label={`Add ${desk.name} to your setup`}
                  className="bg-primary text-on-primary hover:bg-surface-tint flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    add
                  </span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
