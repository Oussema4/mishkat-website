/**
 * Small flags for the language picker, drawn in SVG (emoji flags don't show on Windows).
 * Tunisia for Arabic, France for French, the United States for English.
 */
import { cn } from "@/lib/site";

/** Points of a five-pointed star centred on (cx, cy). */
function star(cx: number, cy: number, outer: number, rotation = -90) {
  const inner = outer * 0.382;
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = ((rotation + i * 36) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function Tunisia() {
  return (
    <>
      <rect width="30" height="20" fill="#E70013" />
      <circle cx="15" cy="10" r="5" fill="#fff" />
      <circle cx="14.4" cy="10" r="3.75" fill="#E70013" />
      <circle cx="15.35" cy="10" r="3" fill="#fff" />
      <polygon points={star(15.9, 10, 2.15, 0)} fill="#E70013" />
    </>
  );
}

function France() {
  return (
    <>
      <rect width="10" height="20" fill="#002654" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </>
  );
}

function UnitedStates() {
  const stripe = 20 / 13;
  return (
    <>
      <rect width="30" height="20" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 2 * stripe} width="30" height={stripe} fill="#B22234" />
      ))}
      <rect width="12" height={stripe * 7} fill="#3C3B6E" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={1.5 + (i % 4) * 3} cy={1.6 + Math.floor(i / 4) * 3.4} r="0.55" fill="#fff" />
      ))}
    </>
  );
}

const FLAGS = { tn: Tunisia, fr: France, us: UnitedStates };

export function Flag({ country, className }: { country: keyof typeof FLAGS; className?: string }) {
  const Shape = FLAGS[country];
  return (
    <svg viewBox="0 0 30 20" aria-hidden className={cn("h-3.5 w-[1.3125rem] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/15", className)}>
      <Shape />
    </svg>
  );
}
