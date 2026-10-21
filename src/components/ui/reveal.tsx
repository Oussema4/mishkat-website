"use client";

import { useEffect, useRef, useState, type ElementType, type ComponentPropsWithoutRef } from "react";

/**
 * Lets a block's direct children rise in one after another when the block scrolls into view.
 * Content is never hidden without JS or with reduced motion:
 *  - "static": server render / no-JS / reduced motion: everything visible, no motion.
 *  - "armed":  below the fold after mount: children hidden, waiting.
 *  - "in":     in view: the staggered entrance runs once.
 */
type RevealState = "static" | "armed" | "in";

export function Reveal<T extends ElementType = "div">({
  as,
  ...props
}: { as?: T } & ComponentPropsWithoutRef<T>) {
  const Tag: ElementType = as ?? "div";
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<RevealState>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        } else if (first) {
          setState("armed");
        }
        first = false;
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <Tag ref={ref} data-reveal={state} {...props} />;
}
