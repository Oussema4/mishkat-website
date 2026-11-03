import { fill } from "@/i18n/ar";
import { getDictionary, type Locale } from "@/i18n/config";
import { formatTND } from "@/lib/money";
import { lineTotal, type PricedLine } from "@/lib/pricing";
import { cn } from "@/lib/site";

/** Line total; when a quantity offer applies, the regular price is shown struck through beside it. */
export function LinePrice({ line, className, locale = "ar" }: { line: PricedLine; className?: string; locale?: Locale }) {
  const total = lineTotal(line);
  const regular = line.unitPrice * line.quantity;
  return (
    <p className={cn("flex flex-wrap items-baseline justify-end gap-x-2 tabular", className)}>
      {total < regular ? (
        <span className="text-sm font-normal text-muted line-through">
          <span className="sr-only">{getDictionary(locale).product.insteadOf}</span>
          {formatTND(regular, locale)}
        </span>
      ) : null}
      <span>{formatTND(total, locale)}</span>
    </p>
  );
}

export function OfferSaving({ line, locale = "ar" }: { line: PricedLine; locale?: Locale }) {
  const saved = line.unitPrice * line.quantity - lineTotal(line);
  if (saved <= 0) return null;
  return <p className="mt-1 text-sm font-medium text-success night:text-gold-light">{fill(getDictionary(locale).cart.offerSaving, { amount: formatTND(saved, locale) })}</p>;
}

export function OrderTotals({
  subtotal,
  deliveryFee,
  total,
  locale = "ar",
}: {
  subtotal: number;
  deliveryFee: number;
  total: number;
  locale?: Locale;
}) {
  const t = getDictionary(locale);
  return (
    <dl className="space-y-3 tabular">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{t.cart.subtotal}</dt>
        <dd>{formatTND(subtotal, locale)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{t.cart.delivery}</dt>
        <dd>{formatTND(deliveryFee, locale)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg font-bold">
        <dt>{t.cart.total}</dt>
        <dd>{formatTND(total, locale)}</dd>
      </div>
    </dl>
  );
}
