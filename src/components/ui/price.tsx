import { fill } from "@/i18n/ar";
import { getDictionary, type Locale } from "@/i18n/config";
import { formatTND } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { cn } from "@/lib/site";

export function Price({
  price,
  compareAt,
  size = "md",
  tone = "light",
  showSave = false,
  locale = "ar",
}: {
  price: number;
  compareAt?: number | null;
  size?: "md" | "lg";
  tone?: "light" | "dark";
  showSave?: boolean;
  locale?: Locale;
}) {
  const t = getDictionary(locale);
  const pct = discountPercent(price, compareAt);
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular">
      <span className={cn("font-bold", size === "lg" ? "text-3xl" : "text-xl")}>{formatTND(price, locale)}</span>
      {pct !== null && compareAt ? (
        <>
          <span className={cn("line-through", tone === "dark" ? "text-paper/65" : "text-muted", size === "lg" ? "text-lg" : "text-base")}>
            <span className="sr-only">{t.product.insteadOf}</span>
            {formatTND(compareAt, locale)}
          </span>
          {showSave ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-sm font-semibold",
                tone === "dark" ? "bg-gold text-ink" : "bg-success-bg text-success night:bg-gold/15 night:text-gold-light",
              )}
            >
              {fill(t.product.save, { n: pct })}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
