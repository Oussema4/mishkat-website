import Image from "next/image";
import Link from "next/link";
import { BRAND_IMAGES } from "@/lib/brand-images";

/*
 * The hero's diagram: a photo of the game being played in the middle, framed as an arched niche (a
 * mishkat) with the Mishkat symbol at its foot, wired to the words around it, with gold light
 * running along the wires (the lamp's light reaching each one). The photo links to the product.
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
  /** Half the centre photo's width plus a little: where wires leave it. */
  exit: number;
  /** The centre photo's width, in board units. */
  photo: number;
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
  h: 500,
  centre: { x: 550, y: 250 },
  photo: 230,
  exit: 117,
  reach: 62,
  shape: "bend",
  turn: 140,
  // Right side reads first (RTL): three there, the rest on the left.
  right: [
    { x: 930, y: 100, side: 1, lane: -24 },
    { x: 1010, y: 250, side: 1, lane: 0 },
    { x: 910, y: 400, side: 1, lane: 24 },
  ],
  left: (count) =>
    count <= 2
      ? [
          { x: 150, y: 160, side: -1, lane: -14 },
          { x: 170, y: 340, side: -1, lane: 14 },
        ]
      : [
          { x: 170, y: 100, side: -1, lane: -24 },
          { x: 90, y: 250, side: -1, lane: 0 },
          { x: 190, y: 400, side: -1, lane: 24 },
        ],
};

const TALL: Board = {
  w: 360,
  h: 560,
  centre: { x: 180, y: 280 },
  photo: 136,
  exit: 70,
  reach: 40,
  shape: "elbow",
  turn: 76,
  right: [
    { x: 300, y: 56, side: 1, lane: -18 },
    { x: 312, y: 280, side: 1, lane: 0 },
    { x: 300, y: 504, side: 1, lane: 18 },
  ],
  left: (count) =>
    count <= 2
      ? [
          { x: 60, y: 130, side: -1, lane: -12 },
          { x: 60, y: 430, side: -1, lane: 12 },
        ]
      : [
          { x: 60, y: 56, side: -1, lane: -18 },
          { x: 48, y: 280, side: -1, lane: 0 },
          { x: 60, y: 504, side: -1, lane: 18 },
        ],
};

export type HeroPhoto = { src: string; width: number; height: number; alt: string; label: string; href: string };

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

function Diagram({ board, fields, photo, className }: { board: Board; fields: string[]; photo: HeroPhoto; className: string }) {
  const slots = [...board.right, ...board.left(fields.length - board.right.length)];
  const nodes: Node[] = fields.slice(0, slots.length).map((label, i) => ({ label, ...slots[i] }));
  const pct = (p: Point) => ({ left: `${(p.x / board.w) * 100}%`, top: `${(p.y / board.h) * 100}%` });
  const symbol = BRAND_IMAGES["mishkat-symbol-gold"];

  return (
    <div className={`relative mx-auto w-full ${className}`} style={{ aspectRatio: `${board.w} / ${board.h}` }}>
      <svg aria-hidden viewBox={`0 0 ${board.w} ${board.h}`} className="absolute inset-0 h-full w-full overflow-visible">
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
      <Link
        href={photo.href}
        aria-label={photo.label}
        title={photo.label}
        className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-t-full rounded-b-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-light"
        style={{ ...pct(board.centre), width: `${(board.photo / board.w) * 100}%` }}
      >
        <span
          className="lamp-core relative block overflow-hidden rounded-t-full rounded-b-3xl border-2 border-gold/60 bg-ink-soft"
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority
            sizes="(min-width: 768px) 230px, 150px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </span>
        <span className="absolute -bottom-6 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-2xl border border-gold/35 bg-ink-soft md:-bottom-7 md:size-14">
          <Image src={symbol.src} alt="" width={symbol.width} height={symbol.height} sizes="40px" className="h-7 w-auto md:h-8" />
        </span>
      </Link>
      {nodes.map((n) => (
        <div
          key={n.label}
          aria-hidden
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-2xl border border-paper/12 bg-ink-soft/90 px-4 py-2.5 text-[0.95rem] font-semibold text-paper/90 md:px-5 md:py-3 md:text-base"
          style={pct(n)}
        >
          {n.label}
        </div>
      ))}
    </div>
  );
}

export function KnowledgeMap({ fields, photo }: { fields: string[]; photo: HeroPhoto }) {
  return (
    <>
      <Diagram board={WIDE} fields={fields} photo={photo} className="hidden max-w-5xl md:block" />
      <Diagram board={TALL} fields={fields} photo={photo} className="max-w-[24rem] md:hidden" />
    </>
  );
}
