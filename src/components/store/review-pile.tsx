"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Review } from "@/db/schema";

const HOLD_MS = 4500;
const SLIDE_MS = 700;

/**
 * Real customer messages inside a gold neon frame: two bright segments of light run around the
 * frame without stopping, and every few seconds the next message slides in from the right while
 * the current one leaves to the left. Pauses while hovered or focused, while the tab is hidden, or
 * when the visitor presses pause; under reduced motion it never moves on its own, the light stays
 * still and messages change without travel. Prev/next always work.
 */
export function ReviewPile({ reviews, labels }: { reviews: Review[]; labels: { prev: string; next: string; pause: string; play: string } }) {
  const n = reviews.length;
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);

  const go = useCallback(
    (step: number) => {
      setLeaving(i);
      setI((i + step + n) % n);
    },
    [i, n],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || held || n < 2) return;
    const id = window.setInterval(() => {
      if (!document.hidden) go(1);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [paused, held, n, go]);

  // The outgoing message is only kept for the length of its exit.
  useEffect(() => {
    if (leaving === null) return;
    const id = window.setTimeout(() => setLeaving(null), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [leaving]);

  if (n === 0) return null;

  const shown = [
    ...(leaving !== null && leaving !== i ? [{ idx: leaving, cls: "msg-out" }] : []),
    { idx: i, cls: "msg-in" },
  ];

  return (
    <div onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="neon-frame relative isolate mx-auto h-[23rem] w-full max-w-[34rem] overflow-hidden rounded-[1.25rem] sm:h-[26rem]">
        {/* the frame: a dim gold line, and two bright segments running around it */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          <rect x="1.5" y="1.5" rx="19" className="h-[calc(100%-3px)] w-[calc(100%-3px)] fill-none stroke-gold/30" strokeWidth={2} />
          <rect
            x="1.5"
            y="1.5"
            rx="19"
            pathLength={1000}
            className="neon-run h-[calc(100%-3px)] w-[calc(100%-3px)] fill-none stroke-gold-light"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>

        {shown.map(({ idx, cls }) => {
          const r = reviews[idx];
          return (
            <figure key={r.id} aria-hidden={cls === "msg-out"} className={`${cls} absolute inset-0 grid place-items-center p-8 sm:p-10`}>
              <Image
                src={r.imageUrl}
                alt={r.alt}
                width={r.width}
                height={r.height}
                sizes="(min-width: 640px) 460px, 80vw"
                className="h-auto max-h-full w-auto max-w-full rounded-xl object-contain"
              />
            </figure>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className="inline-flex size-12 items-center justify-center rounded-full bg-paper/10 transition-colors hover:bg-gold hover:text-ink">
          <ChevronRight aria-hidden className="size-5" />
        </button>
        <span aria-live="polite" className="min-w-16 text-center font-semibold tabular-nums text-paper/85">
          {i + 1} / {n}
        </span>
        <button type="button" onClick={() => go(1)} aria-label={labels.next} className="inline-flex size-12 items-center justify-center rounded-full bg-paper/10 transition-colors hover:bg-gold hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? labels.play : labels.pause}
          className="ms-2 inline-flex size-12 items-center justify-center rounded-full bg-paper/10 transition-colors hover:bg-gold hover:text-ink"
        >
          {paused ? <Play aria-hidden className="size-5" /> : <Pause aria-hidden className="size-5" />}
        </button>
      </div>
    </div>
  );
}
