import type { OrderStatus } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { cn } from "@/lib/site";

/** One filled colour per status, readable at a glance (dark text on a light fill, contrast ≥ 4.5). */
export const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-[#fdeb9c] text-[#5c4700]",
  confirmed: "bg-[#c6eda2] text-[#24480c]",
  preparing: "bg-[#d9c4fb] text-[#3d1385]",
  shipped: "bg-[#bfd3f5] text-[#173777]",
  delivered: "bg-[#a8e3c2] text-[#0d4a2c]",
  cancelled: "bg-[#f7b1b1] text-[#7a1616]",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium", STATUS_STYLES[status], className)}>
      {ar.status[status]}
    </span>
  );
}
