import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { localePath, type Locale } from "@/i18n/config";
import { hashedUserData } from "@/lib/meta-user-data";
import { META_PIXEL_ID, pixelValue } from "@/lib/meta-pixel";
import { siteUrl } from "@/lib/site";

/**
 * Meta Conversions API: every new order is also reported from the server, so the sale reaches
 * Meta even when the browser Pixel is blocked (ad blockers, iOS tracking protection). The event id
 * is the one the order page's Pixel uses, so Meta counts the sale once.
 *
 * META_CAPI_TOKEN (Events Manager → the dataset → Settings → Conversions API → Generate access
 * token) is set in Vercel; without it nothing is sent. META_TEST_EVENT_CODE, while set, sends to
 * Events Manager's "Test events" tab only. Customer details leave hashed (SHA-256), never in clear.
 */
const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v24.0";

/** What the browser sent with the order request: Meta uses it to match the buyer. */
export type BrowserContext = {
  ip: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
};

export async function sendPurchaseToMeta(publicToken: string, locale: Locale, browser: BrowserContext) {
  const token = process.env.META_CAPI_TOKEN?.trim();
  if (!token) return;

  try {
    const [order] = await db.select().from(orders).where(eq(orders.publicToken, publicToken)).limit(1);
    if (!order) return;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const ids = items.map((i) => i.productId).filter((id): id is number => id !== null);

    const event = {
      event_name: "Purchase",
      event_time: Math.floor(order.createdAt.getTime() / 1000),
      // Same id as the order page's Pixel event: Meta keeps one of the two.
      event_id: `purchase:${order.reference}`,
      action_source: "website",
      event_source_url: `${siteUrl()}${localePath(locale, "/checkout")}`,
      user_data: {
        ...hashedUserData(order),
        client_ip_address: browser.ip ?? undefined,
        client_user_agent: browser.userAgent ?? undefined,
        fbp: browser.fbp ?? undefined,
        fbc: browser.fbc ?? undefined,
      },
      custom_data: {
        currency: "TND",
        value: pixelValue(order.total),
        content_type: "product",
        content_ids: ids.map(String),
        contents: items.filter((i) => i.productId !== null).map((i) => ({ id: String(i.productId), quantity: i.quantity })),
        num_items: items.reduce((n, i) => n + i.quantity, 0),
        order_id: order.reference,
      },
    };

    const testCode = process.env.META_TEST_EVENT_CODE?.trim();
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The token goes in the body, never in the URL (URLs end up in logs).
      body: JSON.stringify({ data: [event], access_token: token, ...(testCode ? { test_event_code: testCode } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string; code?: number } } | null;
      console.error("Meta Conversions API refused the Purchase", res.status, body?.error?.code, body?.error?.message);
    }
  } catch (err) {
    console.error("Meta Conversions API failed", err);
  }
}
