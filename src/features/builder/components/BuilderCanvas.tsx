"use client";

import { capKeyForProduct } from "@/shared/domain/setupRules";
import type { CapKey } from "@/shared/domain/setupRules";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import type { Product } from "@/shared/types/product";

import { CanvasSlot } from "./CanvasSlot";

/**
 * The visual workspace canvas (interactive_builder mockup): desk + chair,
 * monitor/lamp/plant slots, and the Coffee Station + Relax Zone secondary
 * zones. Renders whatever the cart holds; empty slots show the dashed state
 * (decision #10, #22, #24; D1 defaults are applied at wiring, e05s03).
 */
export function BuilderCanvas({ catalog }: { catalog: readonly Product[] }) {
  const { state, dispatch } = useBuilderStore();

  const byCapKey = (key: CapKey) => catalog.filter((p) => capKeyForProduct(p) === key);

  const chair = state.chairId ? catalog.find((p) => p.id === state.chairId) : undefined;
  const desk = state.deskId ? catalog.find((p) => p.id === state.deskId) : undefined;

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

      <div className="relative flex h-[440px] w-full max-w-2xl flex-col items-center justify-end gap-6">
        {/* Monitor slot (centered above the desk, mockup) */}
        <CanvasSlot
          capKey="monitor"
          className="absolute bottom-36 left-1/2 -translate-x-1/2"
          dispatch={dispatch}
          emptyHint="Add Monitor"
          icon="add"
          label="Monitor"
          products={byCapKey("monitor")}
          state={state}
        />

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

        {/* Desk — table surface + the selected desk's product image overlapping it */}
        {desk ? (
          <>
            <div
              role="img"
              aria-label="Selected desk"
              className="relative z-0 h-10 w-full rounded-md border border-[#c49a6c] bg-[#e8cdb4] shadow-md"
            >
              <div className="absolute left-4 top-full h-24 w-4 rounded-b-sm bg-[#c49a6c]" />
              <div className="absolute right-4 top-full h-24 w-4 rounded-b-sm bg-[#c49a6c]" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- desk product on the table (mockup parity) */}
            <img
              src={desk.image}
              alt={desk.name}
              className="absolute bottom-6 left-1/2 z-10 h-24 w-40 -translate-x-1/2 object-contain drop-shadow-md"
            />
          </>
        ) : (
          <div
            className="slot-empty h-10 w-full rounded-md"
            role="img"
            aria-label="No desk selected"
          >
            <span className="text-label-sm font-label-sm text-outline">
              Add a desk from the panel
            </span>
          </div>
        )}
      </div>

      {/* Selected chair — its own row above the zone tiles (grilled) */}
      <div className="mt-8 flex justify-center">
        {chair ? (
          // eslint-disable-next-line @next/next/no-img-element -- chair (mockup parity)
          <img
            src={chair.image}
            alt={chair.name}
            className="h-36 w-32 object-contain drop-shadow-md"
          />
        ) : (
          <div
            className="slot-empty flex h-24 w-32 items-center justify-center rounded-md"
            role="img"
            aria-label="No chair selected"
          >
            <span className="text-label-sm font-label-sm text-outline text-center">
              Add a chair from the panel
            </span>
          </div>
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
