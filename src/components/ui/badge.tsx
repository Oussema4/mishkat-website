import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/site";

export type BadgeTone = "neutral" | "gold" | "zaytun" | "success" | "warning" | "danger" | "sabili";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand text-ink",
  gold: "bg-gold-light text-ink",
  zaytun: "bg-zaytun-tint text-zaytun",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  sabili: "bg-sabili-yellow text-sabili-navy",
};

/** The one pill used for stock, discounts, labels and statuses. Status tones always carry an icon. */
export function Badge({
  tone = "neutral",
  icon: Icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm leading-5 font-semibold",
        tones[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden className="size-4 shrink-0" strokeWidth={2} /> : null}
      {children}
    </span>
  );
}
