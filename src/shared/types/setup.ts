/** The cross-feature cart (decisions #10, #11, #20, #22; ADR 0002). */
export interface SetupState {
  /** Single-selection chair id (exclusivity, decision #10). */
  chairId: string | null;
  /** Single-selection desk id (exclusivity, decision #10). */
  deskId: string | null;
  /** Accessory quantities keyed by product id, within per-category caps (#22). */
  quantities: Record<string, number>;
  /** Optional delivery location (decision C4) — trim, non-empty, ≤ 200 chars (G3). */
  deliveryLocation?: string;
}
