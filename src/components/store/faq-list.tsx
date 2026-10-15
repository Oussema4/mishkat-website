import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/db/schema";
import { cn } from "@/lib/site";

export function FaqList({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("divide-y border-y", tone === "dark" ? "divide-paper/15 border-paper/15" : "divide-line border-line")}>
      {items.map((item, i) => (
        <details key={i} className="group">
          <summary
            className={cn(
              "flex min-h-14 list-none items-center justify-between gap-4 py-4 text-start text-lg font-semibold [&::-webkit-details-marker]:hidden",
            )}
          >
            <span>{item.q}</span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-5 shrink-0 transition-transform duration-200 group-open:rotate-180",
                tone === "dark" ? "text-gold" : "text-gold-deep",
              )}
            />
          </summary>
          <p className={cn("max-w-prose pb-5 leading-8", tone === "dark" ? "text-paper/80" : "text-muted")}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
