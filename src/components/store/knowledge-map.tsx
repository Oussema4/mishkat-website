import Image from "next/image";
import { BRAND_IMAGES } from "@/lib/brand-images";

/*
 * The hero's diagram: the Mishkat symbol in the middle, wired to the words around it, with gold
 * light running along the wires (the lamp's light reaching each one).
 * Two boards with the same parts: a wide one for tablets and desktops, and a tall one for phones
 * whose wires bend at right angles so they fit the narrow screen. Tiles are HTML placed at the
 * board's coordinates in percent, so each board scales with its width.
 */
type Point = { x: number; y: number };
type Slot = Point & { side: 1 | -1; lane: number };
type Node = Slot & { label: string };
type Board = {
  w: number;
  h: number;
  centre: Point;
  /** Half the centre tile's width plus a little: where wires leave it. */
  exit: number;
  /** Half a label tile's width: where wires reach it. */
  reach: number;
  right: Slot[];
  left: (count: number) => Slot[];
  /** "bend": along, one 45° bend, along (wide board). "elbow": along, up/down, along (tall board). */
  shape: "bend" | "elbow";
  turn: number;
};

const WIDE: Board = {
  w: 1100,
  h: 380,
  centre: { x: 550, y: 190 },
  exit: 66,
  reach: 62,
  shape: "bend",
  turn: 190,
  // Right side reads first (RTL): three there, the rest on the left.
  right: [
    { x: 930, y: 62, side: 1, lane: -16 },
    { x: 1010, y: 190, side: 1, lane: 0 },
    { x: 910, y: 318, side: 1, lane: 16 },
  ],
  left: (count) =>
    count <= 2
      ? [
          { x: 150, y: 110, side: -1, lane: -10 },
          { x: 170, y: 270, side: -1, lane: 10 },
        ]
      : [
          { x: 170, y: 62, side: -1, lane: -16 },
          { x: 90, y: 190, side: -1, lane: 0 },
          { x: 190, y: 318, side: -1, lane: 16 },
        ],
};

const TALL: Board = {
  w: 360,
  h: 440,
  centre: { x: 180, y: 220 },
  exit: 46,
  reach: 40,
  shape: "elbow",
  turn: 62,
  right: [
    { x: 300, y: 56, side: 1, lane: -14 },
    { x: 312, y: 220, side: 1, lane: 0 },
    { x: 300, y: 384, side: 1, lane: 14 },
  ],
  left: (count) =>
    count <= 2
      ? [
          { x: 60, y: 120, side: -1, lane: -10 },
          { x: 60, y: 320, side: -1, lane: 10 },
        ]
      : [
          { x: 60, y: 56, side: -1, lane: -14 },
          { x: 48, y: 220, side: -1, lane: 0 },
          { x: 60, y: 384, side: -1, lane: 14 },
        ],
};

function wire(b: Board, n: Node) {
  const sx = b.centre.x + n.side * b.exit;
  const sy = b.centre.y + n.lane;
  const ex = n.x - n.side * b.reach;
  if (b.shape === "elbow") {
    const elbowX = b.centre.x + n.side * b.turn;
    return `M${sx} ${sy} H${elbowX} V${n.y} H${ex}`;
  }
  const bendX = b.centre.x + n.side * b.turn;
  const afterBend = bendX + n.side * Math.abs(n.y - sy);
  return `M${sx} ${sy} H${bendX} L${afterBend} ${n.y} H${ex}`;
}

function Diagram({ board, fields, className }: { board: Board; fields: string[]; className: string }) {
  const slots = [...board.right, ...board.left(fields.length - board.right.length)];
  const nodes: Node[] = fields.slice(0, slots.length).map((label, i) => ({ label, ...slots[i] }));
  const pct = (p: Point) => ({ left: `${(p.x / board.w) * 100}%`, top: `${(p.y / board.h) * 100}%` });
  const symbol = BRAND_IMAGES["mishkat-symbol-gold"];

  return (
    <div aria-hidden className={`relative mx-auto w-full ${className}`} style={{ aspectRatio: `${board.w} / ${board.h}` }}>
      <svg viewBox={`0 0 ${board.w} ${board.h}`} className="absolute inset-0 h-full w-full overflow-visible">
        {nodes.map((n) => (
          <path key={`w-${n.label}`} d={wire(board, n)} pathLength={1000} className="fill-none stroke-paper/12" strokeWidth={1.5} />
        ))}
        {nodes.map((n, i) => (
          <path
            key={`p-${n.label}`}
            d={wire(board, n)}
            pathLength={1000}
            className="wire-pulse fill-none stroke-gold-light"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ animationDelay: `${(i * 0.55).toFixed(2)}s` }}
          />
        ))}
      </svg>
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(board.centre)}>
        <div className="lamp-core grid size-20 place-items-center rounded-3xl border border-gold/35 bg-ink-soft md:size-28">
          <Image src={symbol.src} alt="" width={symbol.width} height={symbol.height} sizes="64px" className="h-12 w-auto md:h-16" />
        </div>
      </div>
      {nodes.map((n) => (
        <div
          key={n.label}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-2xl border border-paper/12 bg-ink-soft/90 px-4 py-2.5 text-[0.95rem] font-semibold text-paper/90 md:px-5 md:py-3 md:text-base"
          style={pct(n)}
        >
          {n.label}
        </div>
      ))}
    </div>
  );
}

export function KnowledgeMap({ fields }: { fields: string[] }) {
  return (
    <>
      <Diagram board={WIDE} fields={fields} className="hidden max-w-5xl md:block" />
      <Diagram board={TALL} fields={fields} className="max-w-[24rem] md:hidden" />
    </>
  );
}
