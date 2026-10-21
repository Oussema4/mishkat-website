import { useId } from "react";
import type { FaqItem } from "@/db/schema";
import { cn } from "@/lib/site";

/**
 * Each question is a filled tile one tone off the page (no divider lines). One opens at a time
 * (shared `name`); the open tile turns gold and its plus folds into a minus.
 */
export function FaqList({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  const group = useId();
  if (items.length === 0) return null;
  return (
    <div className="grid gap-2">
      {items.map((item, i) => (
        <details
          key={i}
          name={group}
          className={cn(
            "group rounded-[var(--radius-md)] px-6 transition-colors duration-200 open:bg-gold open:text-ink",
            tone === "dark" ? "bg-paper/8" : "bg-mist",
          )}
        >
          <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-lg font-semibold md:text-xl [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden className="relative size-4 shrink-0">
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-current transition-transform duration-200 group-open:rotate-90" />
            </span>
          </summary>
          <p className="max-w-[52ch] pb-6 text-lg leading-8">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
