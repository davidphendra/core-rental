import { formatIdr } from "../domain/pricing";

interface PriceTagProps {
  amount: number;
  suffix?: string;
  className?: string;
  /** Style for the suffix only — mockup cards render a smaller muted /mo. */
  suffixClassName?: string;
}

/** Single home for IDR display (decision #3) — always renders via formatIdr. */
export function PriceTag({ amount, suffix, className, suffixClassName }: PriceTagProps) {
  return (
    <span className={className}>
      {formatIdr(amount)}
      {suffix !== undefined ? <span className={suffixClassName}>{suffix}</span> : null}
    </span>
  );
}
