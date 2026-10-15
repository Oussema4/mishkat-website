import { Badge } from "@/components/ui/badge";
import { fill, ar } from "@/i18n/ar";
import { formatTND } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { cn } from "@/lib/site";

export function Price({
  price,
  compareAt,
  size = "md",
  tone = "light",
  showSave = false,
}: {
  price: number;
  compareAt?: number | null;
  size?: "md" | "lg";
  tone?: "light" | "dark";
  showSave?: boolean;
}) {
  const pct = discountPercent(price, compareAt);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular">
      <span className={cn("font-bold leading-tight", size === "lg" ? "text-[2rem]" : "text-xl")}>{formatTND(price)}</span>
      {pct !== null && compareAt ? (
        <>
          <span className={cn("line-through decoration-1", tone === "dark" ? "text-paper/65" : "text-muted", size === "lg" ? "text-lg" : "text-base")}>
            <span className="sr-only">بدلًا من </span>
            {formatTND(compareAt)}
          </span>
          {showSave ? <Badge tone={tone === "dark" ? "sabili" : "gold"}>{fill(ar.product.save, { n: pct })}</Badge> : null}
        </>
      ) : null}
    </div>
  );
}
