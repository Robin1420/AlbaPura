import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "glass" | "ghost";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-ink-800 text-dew-50 hover:bg-ink-700",
  accent: "bg-leaf-300 text-ink-900 hover:bg-leaf-400",
  secondary: "border border-ink-800 text-ink-800 hover:bg-ink-800 hover:text-dew-50",
  glass: "border border-dew-50/50 text-dew-50 backdrop-blur-sm hover:bg-dew-50/15",
  ghost: "text-ink-800 hover:bg-ink-800/8",
};

const sizes: Record<Size, string> = {
  lg: "h-14 px-8 text-[16px]",
  md: "h-11 px-6 text-[15px]",
  sm: "h-9 px-4 text-[13px]",
};

type Common = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export function buttonClass({ variant = "primary", size = "md", className = "" }: Omit<Common, "children">) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold tracking-[-0.01em]",
    "transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className,
  ].join(" ");
}

export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<"button">, keyof Common>) {
  return (
    <button className={buttonClass({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, keyof Common>) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...rest}>
      {children}
    </Link>
  );
}
