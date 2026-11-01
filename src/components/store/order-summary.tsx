import { ar, fill } from "@/i18n/ar";
import { formatTND } from "@/lib/money";
import { lineTotal, type PricedLine } from "@/lib/pricing";
import { cn } from "@/lib/site";

/** Line total; when a quantity offer applies, the regular price is shown struck through beside it. */
export function LinePrice({ line, className }: { line: PricedLine; className?: string }) {
  const total = lineTotal(line);
  const regular = line.unitPrice * line.quantity;
  return (
    <p className={cn("flex flex-wrap items-baseline justify-end gap-x-2 tabular", className)}>
      {total < regular ? (
        <span className="text-sm font-normal text-muted line-through">
          <span className="sr-only">بدلًا من </span>
          {formatTND(regular)}
        </span>
      ) : null}
      <span>{formatTND(total)}</span>
    </p>
  );
}

export function OfferSaving({ line }: { line: PricedLine }) {
  const saved = line.unitPrice * line.quantity - lineTotal(line);
  if (saved <= 0) return null;
  return <p className="mt-1 text-sm font-medium text-success night:text-gold-light">{fill(ar.cart.offerSaving, { amount: formatTND(saved) })}</p>;
}

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
