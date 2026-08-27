export interface LineItem {
  pricePerMonth: number;
  quantity: number;
}

/** Format an IDR amount for display (decision #3). Single formatting home. */
export function formatIdr(amount: number): string {
  // Normalize the NBSP that id-ID inserts after "Rp" to a regular space so
  // displayed text is stable for E2E assertions (#37).
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u00a0/g, " ");
}

/** Monthly total = sum of line items (flat monthly pricing, decision #7). */
export function monthlyTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.pricePerMonth * item.quantity, 0);
}
