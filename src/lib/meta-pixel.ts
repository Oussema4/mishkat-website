/**
 * Meta Pixel (Events Manager dataset). The id is public by nature (it is in every page's code);
 * NEXT_PUBLIC_META_PIXEL_ID overrides it. Events go out in dinars, as the shop sells.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1430752171643713";

/**
 * Meta Business domain verification for mishkattn.com (business "mishkat.2025", meta-tag method).
 * Public by nature: it sits in the page head. META_DOMAIN_VERIFICATION overrides it.
 */
export const META_DOMAIN_VERIFICATION = process.env.META_DOMAIN_VERIFICATION?.trim() || "jn8p8civji1oevixgd8oywhk8v2z1p";

/**
 * Meta's loader, run inline in the page head: the PageView (Meta's "landing page view") counts as
 * soon as the HTML arrives, not after the site's JavaScript has loaded. fbevents.js itself loads async.
 */
export const META_PIXEL_SNIPPET = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`;

type Fbq =(command: "track" | "init", event: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;

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
