/**
 * Meta Pixel (Events Manager dataset). The id is public by nature (it is in every page's code);
 * NEXT_PUBLIC_META_PIXEL_ID overrides it. Events go out in dinars, as the shop sells.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1430752171643713";

/** Meta Business domain verification code (public, it sits in the page head). Empty until set. */
export const META_DOMAIN_VERIFICATION = process.env.META_DOMAIN_VERIFICATION?.trim() || "";

type Fbq = (command: "track" | "init", event: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Shop amounts are millimes; Meta wants a plain number in the currency. */
export const pixelValue = (millimes: number) => Math.round(millimes) / 1000;

/** Sends a standard event (no-op until the Pixel has loaded, or when it is blocked). */
export function trackPixel(event: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase", params: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  const data = { currency: "TND", ...params };
  // No empty 4th argument: queued before the Pixel library loads, such a call is dropped.
  if (eventId) window.fbq("track", event, data, { eventID: eventId });
  else window.fbq("track", event, data);
}
