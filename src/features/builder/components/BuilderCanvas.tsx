"use client";

import { capKeyForProduct } from "@/shared/domain/setupRules";
import type { CapKey } from "@/shared/domain/setupRules";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import type { Product } from "@/shared/types/product";

import { CanvasSlot } from "./CanvasSlot";
import { MonitorSlotRow } from "./MonitorSlotRow";

/**
 * The visual workspace canvas (interactive_builder mockup): desk + chair,
 * monitor/lamp/plant slots, and the Coffee Station + Relax Zone secondary
 * zones. Renders whatever the cart holds; empty slots show the dashed state
 * (decision #10, #22, #24; D1 defaults are applied at wiring, e05s03).
 */
export function BuilderCanvas({ catalog }: { catalog: readonly Product[] }) {
  const { state, dispatch } = useBuilderStore();

  const byCapKey = (key: CapKey) => catalog.filter((p) => capKeyForProduct(p) === key);

  const chair = state.chairId ? catalog.find((p) => p.skuNo === state.chairId) : undefined;
  const desk = state.deskId ? catalog.find((p) => p.skuNo === state.deskId) : undefined;

  return (
    <div className="border-surface-container-high bg-surface-bright shadow-ambient relative overflow-hidden rounded-[2rem] border p-8">
      {/* Background dot grid (mockup) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#006767 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex h-[300px] w-full max-w-2xl flex-col items-center justify-end gap-6">
        {/* Three monitor slots (e09s02) — row centered above the desk */}
        <MonitorSlotRow monitors={byCapKey("monitor")} />

        {/* Lamp + plant slots (bottom-left/right of the desk, mockup) */}
        <CanvasSlot
          capKey="lamp"
          className="absolute bottom-2 left-12"
          dispatch={dispatch}
          emptyHint="Add Lamp"
          icon="light"
          label="Lamp"
          products={byCapKey("lamp")}
          state={state}
        />
        <CanvasSlot
          capKey="plant"
          className="absolute bottom-2 right-12"
          dispatch={dispatch}
          emptyHint="Place a Plant"
          icon="local_florist"
          label="Plant"
          products={byCapKey("plant")}
          state={state}
        />

        {/* Desk table — always visible (workspace scene); the selected desk's
        product image + x overlap it, or an add hint sits on it when empty */}
        <div
          role="img"
          aria-label="Desk table"
          className="relative z-0 h-10 w-full rounded-md border border-[#c49a6c] bg-[#e8cdb4] shadow-md"
        >
          <div className="absolute left-4 top-full h-24 w-4 rounded-b-sm bg-[#c49a6c]" />
          <div className="absolute right-4 top-full h-24 w-4 rounded-b-sm bg-[#c49a6c]" />
          {desk === undefined ? (
            <button
              type="button"
              aria-label="Add a desk from the panel"
              onClick={() => {
                const first = catalog.find((p) => p.category === "desk");
                if (first !== undefined) dispatch({ type: "selectDesk", product: first });
              }}
              className="slot-empty hover:bg-surface-container-low focus-visible:outline-primary group absolute inset-0 flex items-center justify-center gap-1 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                className="material-symbols-outlined text-outline group-hover:text-primary"
                aria-hidden="true"
              >
                desk
              </span>
              <span className="text-label-sm font-label-sm text-outline group-hover:text-primary">
                Add a desk from the panel
              </span>
            </button>
          ) : null}
        </div>
        {desk ? (
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- desk product on the table (mockup parity) */}
              <img
                src={desk.image}
                alt={desk.name}
                className="h-24 w-32 object-contain drop-shadow-md"
              />
              {/* Direct removal (like the other product cards) */}
              <button
                type="button"
                aria-label="Remove desk"
                onClick={() => dispatch({ type: "deselectDesk" })}
                className="bg-on-surface/70 text-inverse-on-surface focus-visible:outline-primary hover:bg-on-surface absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Selected chair — its own row above the zone tiles (grilled) */}
      <div className="mt-8 flex justify-center">
        {chair ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- chair (mockup parity) */}
            <img
              src={chair.image}
              alt={chair.name}
              className="h-36 w-48 object-contain drop-shadow-md"
            />
            {/* Direct removal (like the other product cards) */}
            <button
              type="button"
              aria-label="Remove chair"
              onClick={() => dispatch({ type: "deselectChair" })}
              className="bg-on-surface/70 text-inverse-on-surface focus-visible:outline-primary hover:bg-on-surface absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Add a chair from the panel"
            onClick={() => {
              const first = catalog.find((p) => p.category === "chair");
              if (first !== undefined) dispatch({ type: "selectChair", product: first });
            }}
            className="slot-empty hover:bg-surface-container-low focus-visible:outline-primary group flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span
              className="material-symbols-outlined text-outline group-hover:text-primary"
              aria-hidden="true"
            >
              chair
            </span>
            <span className="text-label-sm font-label-sm text-outline group-hover:text-primary text-center">
              Add a chair from the panel
            </span>
          </button>
        )}
      </div>

      {/* Secondary zones (mockup: "Secondary Zones (Extras)") */}
      <div className="relative mt-8 grid grid-cols-2 gap-4">
        <CanvasSlot
          capKey="coffee"
          dispatch={dispatch}
          emptyHint="Add Machine"
          icon="coffee_maker"
          label="Coffee Station"
          products={byCapKey("coffee")}
          state={state}
          variant="zone"
        />
        <CanvasSlot
          capKey="beanbag"
          dispatch={dispatch}
          emptyHint="Add Bean Bag"
          icon="chair_alt"
          label="Relax Zone"
          products={byCapKey("beanbag")}
          state={state}
          variant="zone"
        />
      </div>
    </div>
  );
}
