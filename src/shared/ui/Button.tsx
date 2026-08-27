import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-surface-tint",
  secondary: "border-2 border-primary text-primary hover:bg-primary hover:text-on-primary",
  tertiary: "bg-tertiary-container text-on-tertiary-container hover:opacity-90",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Shared button (a11y baseline #24): real button, focus-visible ring, variants. */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
