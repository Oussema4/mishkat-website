import { cn } from "@/lib/site";

/**
 * Charter divider: a thin line with the niche (from the logo's taa marbuta) in the middle.
 * Separates parts of the content; used sparingly so it stays a signature, not decoration.
 */
export function NicheDivider({ className, tone = "gold" }: { className?: string; tone?: "gold" | "deep" }) {
  const color = tone === "gold" ? "text-gold" : "text-gold-deep";
  return (
    <div aria-hidden className={cn("flex items-center gap-3", color, className)}>
      <span className="h-px flex-1 bg-current opacity-60" />
      <svg viewBox="0 0 28 42" className="h-7 w-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M7 38V15L14 9l7 6v23z" />
        <path d="M10 35V16.6l4-3.4 4 3.4V35z" />
      </svg>
      <span className="h-px flex-1 bg-current opacity-60" />
    </div>
  );
}
