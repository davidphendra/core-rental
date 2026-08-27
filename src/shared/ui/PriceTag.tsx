import { formatIdr } from "../domain/pricing";

interface PriceTagProps {
  amount: number;
  suffix?: string;
  className?: string;
}

/** Single home for IDR display (decision #3) — always renders via formatIdr. */
export function PriceTag({ amount, suffix, className }: PriceTagProps) {
  return (
    <span className={className}>
      {formatIdr(amount)}
      {suffix !== undefined ? suffix : ""}
    </span>
  );
}
