import { cn } from "@/lib/site";

/** The niche from the Mishkat logo as a small glyph: eyebrows, dividers, list bullets, empty states. */
export function NicheMark({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 20 24" className={cn("inline-block h-[1.2em] w-[1em] shrink-0", className)}>
      <path
        d="M2.5 22.5V10.4c0-1.4.7-2.7 1.9-3.5L10 2.2l5.6 4.7c1.2.8 1.9 2.1 1.9 3.5v12.1z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Hairline – niche – hairline. Separates content inside a section; never used between sections. */
export function Divider({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-4", className)}>
      <span className={cn("h-px flex-1", tone === "dark" ? "bg-paper/15" : "bg-line")} />
      <NicheMark className={tone === "dark" ? "text-gold" : "text-gold-deep"} />
      <span className={cn("h-px flex-1", tone === "dark" ? "bg-paper/15" : "bg-line")} />
    </div>
  );
}
