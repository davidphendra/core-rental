import { describe, expect, it } from "vitest";

import type { Product } from "../types/product";
import { EMPTY_SETUP, builderReducer } from "./BuilderStore";
import type { BuilderAction } from "./BuilderStore";

const chair = {
  id: "chair-a",
  name: "A",
  category: "chair",
  pricePerMonth: 100,
  description: "d",
  image: "/c.svg",
} satisfies Product;
const chairB = { ...chair, id: "chair-b", name: "B" } satisfies Product;
const desk = {
  id: "desk-a",
  name: "D",
  category: "desk",
  pricePerMonth: 200,
  description: "d",
  image: "/d.svg",
} satisfies Product;
const monitor = {
  id: "accessory-monitor-m1",
  name: "M1",
  category: "accessory",
  pricePerMonth: 50,
  description: "d",
  image: "/m.svg",
} satisfies Product;
const plant = {
  id: "accessory-plant-p1",
  name: "P1",
  category: "accessory",
  pricePerMonth: 30,
  description: "d",
  image: "/p.svg",
} satisfies Product;
const partner = {
  id: "partner-x",
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
    expect(s3.quantities["accessory-monitor-m1"]).toBe(3);
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
    const s3 = act(s2, { type: "removeAccessory", productId: plant.id });
    expect(s3.quantities[plant.id]).toBe(1);
    const s4 = act(s3, { type: "removeAccessory", productId: plant.id });
    expect(s4.quantities[plant.id]).toBeUndefined();
  });

  it("setQuantity validates bounds (1..cap), 0 removes", () => {
    const s1 = act(EMPTY_SETUP, { type: "setQuantity", product: plant, quantity: 3 });
    expect(s1.quantities[plant.id]).toBe(3);
    const s2 = act(s1, { type: "setQuantity", product: plant, quantity: 5 }); // cap 4
    expect(s2).toBe(s1); // no-op
    const s3 = act(s1, { type: "setQuantity", product: plant, quantity: -1 });
    expect(s3).toBe(s1);
    const s4 = act(s1, { type: "setQuantity", product: plant, quantity: 0 });
    expect(s4.quantities[plant.id]).toBeUndefined();
  });

  it("setDeliveryLocation stores the raw value (validated at submit, G3)", () => {
    const s = act(EMPTY_SETUP, { type: "setDeliveryLocation", value: "Canggu" });
    expect(s.deliveryLocation).toBe("Canggu");
  });

  it("hydrate replaces state; reset clears to empty", () => {
    const s = act(EMPTY_SETUP, {
      type: "hydrate",
      state: { chairId: chair.id, deskId: desk.id, quantities: {} },
    });
    expect(s.chairId).toBe("chair-a");
    expect(act(s, { type: "reset" })).toEqual(EMPTY_SETUP);
  });
});
