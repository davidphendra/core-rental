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
  | { type: "addAccessory"; product: Product }
  | { type: "removeAccessory"; productId: string }
  | { type: "setQuantity"; product: Product; quantity: number }
  | { type: "setDeliveryLocation"; value: string }
  | { type: "reset" };

export const EMPTY_SETUP: SetupState = { chairId: null, deskId: null, quantities: {} };

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
      return { ...state, chairId: action.product.id };

    case "selectDesk":
      return { ...state, deskId: action.product.id };

    case "addAccessory": {
      if (!canAdd(state, action.product)) {
        return state; // over cap or partner — G2 quiet no-op
      }
      const next = (state.quantities[action.product.id] ?? 0) + 1;
      return { ...state, quantities: { ...state.quantities, [action.product.id]: next } };
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
        delete next[action.product.id];
      } else {
        next[action.product.id] = qty;
      }
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
