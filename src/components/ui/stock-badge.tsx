import { CircleCheck, CircleAlert, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ar, fill } from "@/i18n/ar";

export const LOW_STOCK = 5;

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const state = stock <= 0 ? "out" : stock <= LOW_STOCK ? "low" : "in";
  const label = state === "out" ? ar.shop.outOfStock : state === "low" ? fill(ar.shop.lowStock, { n: stock }) : ar.shop.inStock;
  return (
    <Badge
      tone={state === "out" ? "danger" : state === "low" ? "warning" : "success"}
      icon={state === "out" ? CircleX : state === "low" ? CircleAlert : CircleCheck}
      className={className}
    >
      {label}
    </Badge>
  );
}
