import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/site";

type Variant = "primary" | "gold" | "outline" | "ghost" | "sabili" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold whitespace-nowrap " +
  "transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper shadow-[var(--shadow-soft)] hover:bg-ink-soft",
  gold: "bg-gold text-ink hover:bg-gold-light",
  outline: "border-[1.5px] border-ink/85 text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-sand",
  sabili: "bg-sabili-yellow text-sabili-navy hover:bg-sabili-yellow-light",
  danger: "bg-danger text-paper hover:bg-danger-deep",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
