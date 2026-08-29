import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import { EMPTY_SETUP, builderReducer } from "./BuilderStore";
import type { BuilderAction } from "./BuilderStore";

const chair = {
  skuNo: "chair-a",
  name: "A",
  category: "chair",
  pricePerMonth: 100,
  description: "d",
  image: "/c.svg",
} satisfies Product;
const chairB = { ...chair, skuNo: "chair-b", name: "B" } satisfies Product;
const desk = {
  skuNo: "desk-a",
  name: "D",
  category: "desk",
  pricePerMonth: 200,
  description: "d",
  image: "/d.svg",
} satisfies Product;
const monitor = {
  skuNo: "MONA1B2C3D4E",
  name: "M1",
  category: "accessory",
  pricePerMonth: 50,
  description: "d",
  image: "/m.svg",
} satisfies Product;
const plant = {
  skuNo: "PLTA1B2C3D4E",
  name: "P1",
  category: "accessory",
  pricePerMonth: 30,
  description: "d",
  image: "/p.svg",
} satisfies Product;
const partner = {
  skuNo: "partner-x",
  name: "X",
  category: "partner",
  pricePerMonth: 999,
  description: "d",
  image: "/x.svg",
} satisfies Product;

const act = (state: ReturnType<typeof builderReducer>, action: BuilderAction) =>
  builderReducer(state, action);

describe("builderReducer (G2, decisions #10 #20 #22)", () => {
  it("selecting a chair replaces the previous one (exclusivity)", () => {
    const s1 = act(EMPTY_SETUP, { type: "selectChair", product: chair });
    const s2 = act(s1, { type: "selectChair", product: chairB });
    expect(s2.chairId).toBe("chair-b");
  });

  it("deselectChair / deselectDesk clear the selection", () => {
    const s1 = act(EMPTY_SETUP, { type: "selectChair", product: chair });
    const s2 = act(s1, { type: "selectDesk", product: desk });
    const s3 = act(s2, { type: "deselectChair" });
    expect(s3.chairId).toBeNull();
    expect(s3.deskId).toBe("desk-a");
    const s4 = act(s3, { type: "deselectDesk" });
    expect(s4.deskId).toBeNull();
  });

  it("addAccessory increments up to the cap, then no-ops", () => {
    const s1 = act(EMPTY_SETUP, { type: "addAccessory", product: monitor });
    const s2 = act(s1, { type: "addAccessory", product: monitor });
    const s3 = act(s2, { type: "addAccessory", product: monitor });
    expect(s3.quantities["MONA1B2C3D4E"]).toBe(3);
    const s4 = act(s3, { type: "addAccessory", product: monitor });
    expect(s4).toBe(s3); // quiet no-op at cap (N3)
  });

  it("rejects partner products entirely", () => {
    const s = act(EMPTY_SETUP, { type: "addAccessory", product: partner });
    expect(s).toBe(EMPTY_SETUP); // structurally excluded (N6)
  });

  it("removeAccessory decrements, then removes the key", () => {
    const s1 = act(EMPTY_SETUP, { type: "addAccessory", product: plant });
    const s2 = act(s1, { type: "addAccessory", product: plant });
    const s3 = act(s2, { type: "removeAccessory", productId: plant.skuNo });
    expect(s3.quantities[plant.skuNo]).toBe(1);
    const s4 = act(s3, { type: "removeAccessory", productId: plant.skuNo });
    expect(s4.quantities[plant.skuNo]).toBeUndefined();
  });

  it("setQuantity validates bounds (1..cap), 0 removes", () => {
    const s1 = act(EMPTY_SETUP, { type: "setQuantity", product: plant, quantity: 3 });
    expect(s1.quantities[plant.skuNo]).toBe(3);
    const s2 = act(s1, { type: "setQuantity", product: plant, quantity: 5 }); // cap 4
    expect(s2).toBe(s1); // no-op
    const s3 = act(s1, { type: "setQuantity", product: plant, quantity: -1 });
    expect(s3).toBe(s1);
    const s4 = act(s1, { type: "setQuantity", product: plant, quantity: 0 });
    expect(s4.quantities[plant.skuNo]).toBeUndefined();
  });

  it("setDeliveryLocation stores the raw value (validated at submit, G3)", () => {
    const s = act(EMPTY_SETUP, { type: "setDeliveryLocation", value: "Canggu" });
    expect(s.deliveryLocation).toBe("Canggu");
  });

  it("hydrate replaces state; reset clears to empty", () => {
    const s = act(EMPTY_SETUP, {
      type: "hydrate",
      state: { chairId: chair.skuNo, deskId: desk.skuNo, quantities: {}, monitorSlots: [] },
    });
    expect(s.chairId).toBe("chair-a");
    expect(act(s, { type: "reset" })).toEqual(EMPTY_SETUP);
  });
});

describe("monitor slots (e09s02)", () => {
  const m1 = monitor; // MONA1B2C3D4E
  const m2 = { ...monitor, skuNo: "MONA1B2C3D4F", name: "M2" } satisfies Product;
  const m3 = { ...monitor, skuNo: "MONA1B2C3D4G", name: "M3" } satisfies Product;
  const m4 = { ...monitor, skuNo: "MONA1B2C3D4H", name: "M4" } satisfies Product;

  it("selectMonitor fills the first empty slot (append, insertion-ordered)", () => {
    const s = act(EMPTY_SETUP, { type: "selectMonitor", product: m1 });
    expect(s.monitorSlots).toEqual([m1.skuNo]);
    const s2 = act(s, { type: "selectMonitor", product: m2 });
    expect(s2.monitorSlots).toEqual([m1.skuNo, m2.skuNo]);
  });

  it("selectMonitor appends duplicates while space remains (builds 2A+1B)", () => {
    const s1 = act(EMPTY_SETUP, { type: "selectMonitor", product: m1 });
    const s2 = act(s1, { type: "selectMonitor", product: m1 });
    expect(s2.monitorSlots).toEqual([m1.skuNo, m1.skuNo]);
  });

  it("selectMonitor with 3 full replaces the most recently added (last)", () => {
    let s = EMPTY_SETUP;
    for (const m of [m1, m2, m3]) s = act(s, { type: "selectMonitor", product: m });
    expect(s.monitorSlots).toEqual([m1.skuNo, m2.skuNo, m3.skuNo]);
    const replaced = act(s, { type: "selectMonitor", product: m4 });
    expect(replaced.monitorSlots).toEqual([m1.skuNo, m2.skuNo, m4.skuNo]);
  });

  it("selectMonitor with 3 full is still a no-op for an already-placed model", () => {
    let s = EMPTY_SETUP;
    for (const m of [m1, m2, m3]) s = act(s, { type: "selectMonitor", product: m });
    expect(act(s, { type: "selectMonitor", product: m1 })).toBe(s);
  });

  it("removeMonitorSlot clears by index (later slots shift left)", () => {
    let s = EMPTY_SETUP;
    for (const m of [m1, m2, m3]) s = act(s, { type: "selectMonitor", product: m });
    const s2 = act(s, { type: "removeMonitorSlot", index: 1 });
    expect(s2.monitorSlots).toEqual([m1.skuNo, m3.skuNo]);
  });

  it("removeMonitorSlot with an out-of-range index is a quiet no-op", () => {
    expect(act(EMPTY_SETUP, { type: "removeMonitorSlot", index: 0 })).toBe(EMPTY_SETUP);
  });

  it("supports duplicate models across slots (2A + 1B, 3C)", () => {
    let s = EMPTY_SETUP;
    for (const m of [m1, m1, m2]) s = act(s, { type: "selectMonitor", product: m });
    expect(s.monitorSlots).toEqual([m1.skuNo, m1.skuNo, m2.skuNo]);
  });

  it("EMPTY_SETUP starts with no monitor slots", () => {
    expect(EMPTY_SETUP.monitorSlots).toEqual([]);
  });
});
