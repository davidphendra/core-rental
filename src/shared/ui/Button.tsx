import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-surface-tint",
  secondary: "border-2 border-primary text-primary hover:bg-primary hover:text-on-primary",
  tertiary: "bg-tertiary-container text-on-tertiary-container hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  md: "px-6 py-3",
  sm: "px-2 py-1",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Shared button (a11y baseline #24): real button, focus-visible ring, variants. */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
