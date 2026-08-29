/** The cross-feature cart (decisions #10, #11, #20, #22; ADR 0002). */
export interface SetupState {
  /** Single-selection chair id (exclusivity, decision #10). */
  chairId: string | null;
  /** Single-selection desk id (exclusivity, decision #10). */
  deskId: string | null;
  /** Accessory quantities keyed by product id, within per-category caps (#22). */
  quantities: Record<string, number>;
  /**
   * e09s02: monitor slots — insertion-ordered skuNos, max 3. Insertion order
   * IS recency: the last element is the most recently added (replace target).
   * Monitors no longer live in `quantities`.
   */
  monitorSlots: string[];
  /** Optional delivery location (decision C4) — trim, non-empty, ≤ 200 chars (G3). */
  deliveryLocation?: string;
}
