"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_PIXEL_ID, trackPixel } from "@/lib/meta-pixel";

/**
 * Counts a PageView on every client-side navigation of the store (never the dashboard). The
 * Pixel itself and the first PageView come from META_PIXEL_SNIPPET in the store layout's head.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // The first PageView is sent by the loader itself.
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}

/** Fires one standard event when it mounts (once per key for a Purchase, even on reload). */
export function PixelEvent({
  event,
  params,
  onceKey,
}: {
  event: "ViewContent" | "InitiateCheckout" | "Purchase";
  params: Record<string, unknown>;
  /** Same key → sent once per browser (an order page reopened is not a second sale). */
  onceKey?: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const storageKey = onceKey ? `mk-pixel:${onceKey}` : null;
    try {
      if (storageKey && localStorage.getItem(storageKey)) return;
    } catch {
      /* storage blocked: send anyway */
    }
    // The Pixel loads after the page; wait for it briefly.
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      if (window.fbq || tries > 40) {
        window.clearInterval(timer);
        if (!window.fbq) return;
        trackPixel(event, params, onceKey);
        try {
          if (storageKey) localStorage.setItem(storageKey, "1");
        } catch {
          /* ignore */
        }
      }
    }, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
