import { CircleCheck, CircleAlert, CircleX } from "lucide-react";
import { fill } from "@/i18n/ar";
import { getDictionary, type Locale } from "@/i18n/config";
import { cn } from "@/lib/site";

export const LOW_STOCK = 5;

export function StockBadge({ stock, className, locale = "ar" }: { stock: number; className?: string; locale?: Locale }) {
  const t = getDictionary(locale);
  const state = stock <= 0 ? "out" : stock <= LOW_STOCK ? "low" : "in";
  const Icon = state === "out" ? CircleX : state === "low" ? CircleAlert : CircleCheck;
  const label = state === "out" ? t.shop.outOfStock : state === "low" ? fill(t.shop.lowStock, { n: stock }) : t.shop.inStock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        state === "out" ? "text-danger" : state === "low" ? "text-warning" : "text-success",
        className,
      )}
    >
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      {label}
    </span>
  );
}
