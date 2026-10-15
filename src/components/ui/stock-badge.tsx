import { CircleCheck, CircleAlert, CircleX } from "lucide-react";
import { ar, fill } from "@/i18n/ar";
import { cn } from "@/lib/site";

export const LOW_STOCK = 5;

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const state = stock <= 0 ? "out" : stock <= LOW_STOCK ? "low" : "in";
  const Icon = state === "out" ? CircleX : state === "low" ? CircleAlert : CircleCheck;
  const label = state === "out" ? ar.shop.outOfStock : state === "low" ? fill(ar.shop.lowStock, { n: stock }) : ar.shop.inStock;
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
