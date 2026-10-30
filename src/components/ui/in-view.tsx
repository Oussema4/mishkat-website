"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Pauses the CSS animations inside while the block is off-screen (data-offscreen, see globals.css),
 * so decorative motion costs nothing while the visitor reads another part of the page.
 */
export function PauseOffscreen({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} data-offscreen={offscreen || undefined}>
      {children}
    </div>
  );
}

/**
 * An iframe that only starts loading once it comes into view (with a little margin). The browser's
 * own loading="lazy" fetches iframes from far below the screen, which made the rules deck cost
 * every visit to the product page, scrolled to or not.
 */
export function FrameWhenVisible({ src, title, className }: { src: string; title: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setShow(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {show ? <iframe src={src} title={title} allow="fullscreen" className="h-full w-full rounded-[inherit]" /> : null}
      <noscript>
        <iframe src={src} title={title} loading="lazy" className="h-full w-full rounded-[inherit]" />
      </noscript>
    </div>
  );
}
