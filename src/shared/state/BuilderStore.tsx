"use client";

import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";

import { canAdd, capKeyForProduct, QUANTITY_CAPS } from "../domain/setupRules";
import type { Product } from "../types/product";
import type { SetupState } from "../types/setup";

export type BuilderAction =
  | { type: "hydrate"; state: SetupState }
  | { type: "selectChair"; product: Product }
  | { type: "selectDesk"; product: Product }
  | { type: "deselectChair" }
  | { type: "deselectDesk" }
  | { type: "addAccessory"; product: Product }
  | { type: "removeAccessory"; productId: string }
  | { type: "setQuantity"; product: Product; quantity: number }
  | { type: "selectMonitor"; product: Product }
  | { type: "removeMonitorSlot"; index: number }
  | { type: "replaceExclusiveAccessory"; target: Product; clearSkus: string[] }
  | { type: "setDeliveryLocation"; value: string }
  | { type: "reset" };

export const EMPTY_SETUP: SetupState = {
  chairId: null,
  deskId: null,
  quantities: {},
  monitorSlots: [],
};

/**
 * The single mutation path for the cart (ADR 0002). Every action is validated
 * against setupRules (G2): invalid transitions return the previous state
 * unchanged — quiet no-ops, never crashes, never invalid state.
 */
export function builderReducer(state: SetupState, action: BuilderAction): SetupState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "selectChair":
      return { ...state, chairId: action.product.skuNo };

    case "selectDesk":
      return { ...state, deskId: action.product.skuNo };

    case "deselectChair":
      return { ...state, chairId: null };

    case "deselectDesk":
      return { ...state, deskId: null };

    case "addAccessory": {
      if (!canAdd(state, action.product)) {
        return state; // over cap or partner — G2 quiet no-op
      }
      const next = (state.quantities[action.product.skuNo] ?? 0) + 1;
      return { ...state, quantities: { ...state.quantities, [action.product.skuNo]: next } };
    }

    case "removeAccessory": {
      const next = { ...state.quantities };
      const current = next[action.productId];
      if (current === undefined) {
        return state;
      }
      if (current <= 1) {
        delete next[action.productId];
      } else {
        next[action.productId] = current - 1;
      }
      return { ...state, quantities: next };
    }

    case "setQuantity": {
      const cap = capKeyForProduct(action.product);
      const max = cap === null ? null : QUANTITY_CAPS[cap];
      const qty = action.quantity;
      if (!Number.isInteger(qty) || qty < 0 || (max !== null && qty > max)) {
        return state; // invalid quantity — quiet no-op
      }
      const next = { ...state.quantities };
      if (qty === 0) {
        delete next[action.product.skuNo];
      } else {
        next[action.product.skuNo] = qty;
      }
      return { ...state, quantities: next };
    }

    /** e09s02 monitor slots (Q1 ruling + update): space → append (duplicates
     * build 2A+1B, 3C); full → replace the most recently added card with ANY
     * selection — even an already-placed model (2A reachable from a full row);
     * full + selecting the current last model → quiet no-op (identical value). */
    case "selectMonitor": {
      const sku = action.product.skuNo;
      if (state.monitorSlots.length >= 3) {
        if (state.monitorSlots[state.monitorSlots.length - 1] === sku) {
          return state; // already the most recent — identical value, no-op
        }
        const next = [...state.monitorSlots];
        next[next.length - 1] = sku; // replace most recently added (Q1)
        return { ...state, monitorSlots: next };
      }
      // Space available: append — first empty slot; duplicates allowed.
      return { ...state, monitorSlots: [...state.monitorSlots, sku] };
    }

    case "removeMonitorSlot": {
      const { index } = action;
      if (!Number.isInteger(index) || index < 0 || index >= state.monitorSlots.length) {
        return state; // invalid index — quiet no-op
      }
      const next = [...state.monitorSlots];
      next.splice(index, 1);
      return { ...state, monitorSlots: next };
    }

    /**
     * coffee/beanbag single-select: clicking another machine in the panel
     * REPLACES the zone's selected one — clear same-capKey siblings (except
     * the target) and set the target to 1 (max is 1 per the cap table).
     */
    case "replaceExclusiveAccessory": {
      const next = { ...state.quantities };
      for (const sku of action.clearSkus) {
        if (sku !== action.target.skuNo) {
          delete next[sku];
        }
      }
      next[action.target.skuNo] = 1;
      return { ...state, quantities: next };
    }

    case "setDeliveryLocation":
      return { ...state, deliveryLocation: action.value };

    case "reset":
      return EMPTY_SETUP;

    default:
      return state;
  }
}

interface StoreValue {
  state: SetupState;
  dispatch: Dispatch<BuilderAction>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function BuilderStoreProvider({
  value,
  children,
}: {
  value: StoreValue;
  children: ReactNode;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useBuilderStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (ctx === null) {
    throw new Error("useBuilderStore must be used within BuilderStoreProvider");
  }
  return ctx;
}

/** Convenience for components that only read state. */
export function useBuilderState(): SetupState {
  return useBuilderStore().state;
}

/** Convenience for components that only dispatch. */
export function useBuilderDispatch(): Dispatch<BuilderAction> {
  return useBuilderStore().dispatch;
}

/** Reducer + initial state as a hook (used by tests and CartProvider). */
export function useBuilderReducer(initialState: SetupState) {
  return useReducer(builderReducer, initialState);
}
