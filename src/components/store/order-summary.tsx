import { ar } from "@/i18n/ar";
import { formatTND } from "@/lib/money";

export function OrderTotals({ subtotal, deliveryFee, total }: { subtotal: number; deliveryFee: number; total: number }) {
  return (
    <dl className="space-y-3 tabular">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{ar.cart.subtotal}</dt>
        <dd>{formatTND(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{ar.cart.delivery}</dt>
        <dd>{formatTND(deliveryFee)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg font-bold">
        <dt>{ar.cart.total}</dt>
        <dd>{formatTND(total)}</dd>
      </div>
    </dl>
  );
}
