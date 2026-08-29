"use client";

import { logger } from "../observability/logger";
import { validateSetupState } from "../domain/validateSetupState";
import type { Product } from "../types/product";
import type { SetupState } from "../types/setup";

export const STORAGE_KEY = "core-rental:setup:v2"; // e09: skuNo + monitorSlots shape; old v1 carts are dropped by design

/**
 * G1 + E3 persistence layer. Reads are validate-and-fallback (corrupt or
 * unparseable payloads → null, so callers apply defaults — never crash, never
 * render corrupt state). Writes are quota-guarded: failure → warn + in-memory
 * degrade (E3).
 */

export function readStoredSetup(catalog: readonly Product[]): SetupState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const payload: unknown = JSON.parse(raw);
    const validated = validateSetupState(payload, catalog);
    if (validated === null) {
      logger.warn("validation.rejected", { reason: "invalid_setup" });
    }
    return validated;
  } catch {
    logger.warn("validation.rejected", { reason: "unparseable" });
    return null; // unparseable → defaults (G1)
  }
}

export function writeStoredSetup(state: SetupState): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    // E3: QuotaExceededError or write failure → warn + in-memory degrade (O2 taxonomy).
    logger.warn("storage.degraded", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return false;
  }
}
