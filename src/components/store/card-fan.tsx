"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CARD_IMAGES, type CardName } from "@/lib/card-images";

/**
 * The five Sabili category cards (digital artwork). They fan out when the fan scrolls into
 * view, not on page load, so the motion is actually seen.
 *  - "static": server render, no-JS and reduced motion — cards already fanned, no animation.
 *  - "armed":  off-screen after mount — cards stacked and hidden, waiting.
 *  - "play":   in view — the fan-in animation runs once.
 */
const CARDS: { name: CardName; label: string }[] = [
  { name: "color-tarikh", label: "تاريخ إسلامي" },
  { name: "color-sira", label: "سيرة" },
  { name: "color-quran", label: "قرآن" },
  { name: "color-fiqh", label: "فقه" },
  { name: "color-aqida", label: "عقيدة" },
];

type FanState = "static" | "armed" | "play";

export function CardFan() {
  const ref = useRef<HTMLUListElement>(null);
  const [state, setState] = useState<FanState>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("play");
          io.disconnect();
        } else if (first) {
          setState("armed");
        }
        first = false;
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mid = (CARDS.length - 1) / 2;
  return (
    <ul
      ref={ref}
      data-fan={state}
      aria-label="أصناف بطاقات سبيلي الخمسة"
      className="card-fan relative mx-auto h-[19rem] w-full max-w-[26rem] sm:h-[24rem]"
    >
      {CARDS.map((c, i) => {
        const offset = i - mid;
        const img = CARD_IMAGES[c.name];
        return (
          <li
            key={c.name}
            className="fan-card absolute bottom-0 start-1/2 -ms-[3.75rem] w-[7.5rem] origin-bottom [--fan-rot:6deg] [--fan-step:2.1rem] sm:-ms-[4.75rem] sm:w-[9.5rem] sm:[--fan-rot:11deg] sm:[--fan-step:3.6rem] lg:[--fan-rot:8deg] lg:[--fan-step:2.8rem] xl:[--fan-rot:11deg] xl:[--fan-step:3.6rem]"
            style={
              {
                "--fan-x": `calc(var(--fan-step) * ${offset})`,
                "--fan-y": `${Math.abs(offset) * 0.6}rem`,
                "--fan-r": `calc(var(--fan-rot) * ${offset})`,
                "--fan-delay": `${80 + i * 70}ms`,
                zIndex: 10 - Math.abs(Math.round(offset)),
              } as React.CSSProperties
            }
          >
            <Image
              src={img.src}
              alt={`بطاقة ${c.label}`}
              width={img.width}
              height={img.height}
              sizes="(min-width: 640px) 152px, 120px"
              quality={90}
              className="h-auto w-full drop-shadow-[0_14px_22px_rgba(0,0,0,0.35)]"
            />
          </li>
        );
      })}
    </ul>
  );
}
