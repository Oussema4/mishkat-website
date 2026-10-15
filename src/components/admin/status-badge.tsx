import type { OrderStatus } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { cn } from "@/lib/site";

const styles: Record<OrderStatus, string> = {
  new: "bg-[#fff4dc] text-[#7a4a00] ring-[#f0d9a6]",
  confirmed: "bg-[#e8efff] text-[#1f3a9e] ring-[#c9d6fb]",
  preparing: "bg-[#f1ebff] text-[#5a2aa8] ring-[#ddd0fa]",
  shipped: "bg-[#e6f4f7] text-[#155e6e] ring-[#c3e2ea]",
  delivered: "bg-success-bg text-success ring-[#c5e5d2]",
  cancelled: "bg-mist text-muted ring-line line-through decoration-1",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset", styles[status])}>
      {ar.status[status]}
    </span>
  );
}
