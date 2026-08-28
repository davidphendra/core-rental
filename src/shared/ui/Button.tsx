import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

type Size = "md" | "sm" | "circle";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-surface-tint",
  secondary: "border-2 border-primary text-primary hover:bg-primary hover:text-on-primary",
  tertiary: "bg-tertiary-container text-on-tertiary-container hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  md: "rounded-xl px-6 py-3",
  sm: "rounded-xl px-2 py-1",
  // Circular icon button (matches the home page's add-to-setup circle).
  circle: "h-8 w-8 rounded-full p-0",
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
      className={`focus-visible:outline-primary inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
