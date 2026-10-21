import Image from "next/image";
import { BRAND_IMAGES } from "@/lib/brand-images";

/*
 * The hero's diagram: the Mishkat symbol in the middle, wired to the fields of knowledge around
 * it, with gold light running along the wires (the lamp's light reaching each field).
 * Drawn on a 1100×380 board; the tiles are HTML placed at the same coordinates in percent.
 * Phones get the symbol with the fields as a wrapped row underneath (no wires).
 */
const W = 1100;
const H = 380;
const C = { x: 550, y: 190 };

type Node = { label: string; x: number; y: number; side: 1 | -1; lane: number };

export function KnowledgeMap({ fields }: { fields: string[] }) {
  // Right side reads first (RTL): three there, the rest on the left. Lanes spread the wires where
  // they leave the centre tile.
  const right: Omit<Node, "label">[] = [
    { x: 930, y: 62, side: 1, lane: -16 },
    { x: 1010, y: 190, side: 1, lane: 0 },
    { x: 910, y: 318, side: 1, lane: 16 },
  ];
  const left: Omit<Node, "label">[] =
    fields.length <= 5
      ? [
          { x: 150, y: 110, side: -1, lane: -10 },
          { x: 170, y: 270, side: -1, lane: 10 },
        ]
      : [
          { x: 170, y: 62, side: -1, lane: -16 },
          { x: 90, y: 190, side: -1, lane: 0 },
          { x: 190, y: 318, side: -1, lane: 16 },
        ];
  const slots = [...right, ...left];
  const nodes: Node[] = fields.slice(0, slots.length).map((label, i) => ({ label, ...slots[i] }));

  // A circuit-like wire: out of the centre, along, one 45° bend, then into the tile.
  const wire = (n: Node) => {
    const sx = C.x + n.side * 66;
    const sy = C.y + n.lane;
    const bendX = C.x + n.side * 190;
    const dy = n.y - sy;
    const afterBend = bendX + n.side * Math.abs(dy);
    const ex = n.x - n.side * 62;
    return `M${sx} ${sy} H${bendX} L${afterBend} ${n.y} H${ex}`;
  };

  const symbol = BRAND_IMAGES["mishkat-symbol-gold"];
  const centre = (
    <div className="lamp-core grid size-24 place-items-center rounded-3xl border border-gold/35 bg-ink-soft md:size-28">
      <Image src={symbol.src} alt="" width={symbol.width} height={symbol.height} sizes="64px" className="h-14 w-auto md:h-16" />
    </div>
  );

  return (
    <>
      {/* Desktop and tablet: the wired board */}
      <div aria-hidden className="relative mx-auto hidden aspect-[1100/380] w-full max-w-5xl md:block">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible">
          {nodes.map((n) => (
            <path key={`w-${n.label}`} d={wire(n)} pathLength={1000} className="fill-none stroke-paper/12" strokeWidth={1.5} />
          ))}
          {nodes.map((n, i) => (
            <path
              key={`p-${n.label}`}
              d={wire(n)}
              pathLength={1000}
              className="wire-pulse fill-none stroke-gold-light"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ animationDelay: `${(i * 0.55).toFixed(2)}s` }}
            />
          ))}
        </svg>
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(C.x / W) * 100}%`, top: `${(C.y / H) * 100}%` }}>
          {centre}
        </div>
        {nodes.map((n) => (
          <div
            key={n.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-2xl border border-paper/12 bg-ink-soft/90 px-5 py-3 text-base font-semibold text-paper/90"
            style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}
          >
            {n.label}
          </div>
        ))}
      </div>

      {/* Phones: the symbol, then the fields */}
      <div className="md:hidden">
        <div className="flex justify-center">{centre}</div>
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {nodes.map((n) => (
            <li key={n.label} className="rounded-2xl border border-paper/12 bg-ink-soft px-4 py-2.5 text-[0.95rem] font-semibold text-paper/90">
              {n.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
