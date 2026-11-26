"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fill } from "@/i18n/ar";
import { getDictionary, isLocale, type Locale } from "@/i18n/config";
import { findCommune } from "@/lib/maystro";
import { checkoutSchemaFor, fieldErrors } from "@/lib/validation";
import { getCartSnapshot } from "@/server/catalog";
import { createOrder } from "@/server/order-core";
import { clientIp, hit } from "@/server/rate-limit";
import { hasInsult, isFakePhone } from "@/lib/spam";
import { checkTicket, hashIp, isBlockedConnection, issueTicket, TICKET_LIFETIME_MS } from "@/server/order-guard";
import { getCommunes } from "@/server/maystro";
import { sendPurchaseToMeta } from "@/server/meta-capi";
import { markLeadConverted, parseLeadInput, saveLead } from "@/server/leads";
import { notifyNewLead, notifyNewOrder } from "@/server/notify";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSettings } from "@/server/settings";

export type PlaceOrderResult =
  | { ok: true; token: string }
  | { ok: false; errors?: Record<string, string>; message?: string; refreshCart?: boolean; newKey?: boolean; newTicket?: boolean };

// Abuse guards shared by every server instance (counted in the database): orders per connection,
// per hour and per day. Open orders per phone number are capped in createOrder.
const orderLimits = (ip: string) => [
  { key: `order:ip:${ip}`, max: 4, windowMs: 60 * 60 * 1000 },
  { key: `order:ip-day:${ip}`, max: 8, windowMs: 24 * 60 * 60 * 1000 },
];

/**
 * The order form asks for a ticket when the customer starts filling it in (see order-guard.ts):
 * an order is only taken with a ticket a few seconds old, and each ticket places one order.
 */
export async function orderTicket(): Promise<string> {
  return issueTicket();
}

export async function placeOrder(input: unknown, lang?: unknown): Promise<PlaceOrderResult> {
  const locale: Locale = isLocale(lang) ? lang : "ar";
  const t = getDictionary(locale);
  // Honeypot: real customers never fill this hidden field (bots fill every field). Logged, so a
  // refusal shows up in the Vercel logs instead of passing for an unexplained error.
  const trap = typeof input === "object" && input && "trap" in input ? String((input as { trap?: unknown }).trap ?? "") : "";
  if (trap) {
    console.warn("placeOrder refused: honeypot field filled", { length: trap.length });
    return { ok: false, message: t.checkout.serverError };
  }

  const raw = (typeof input === "object" && input ? input : {}) as { ticket?: unknown; wd?: unknown };
  // A browser driven by a script (Selenium, Playwright, Puppeteer…) says so in navigator.webdriver.
  if (raw.wd === true) {
    console.warn("placeOrder refused: automated browser");
    return { ok: false, message: t.checkout.serverError };
  }

  const parsed = checkoutSchemaFor(t.validation).safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  // A made-up number nobody can be called on, or insults typed into the form.
  if (isFakePhone(parsed.data.phone)) return { ok: false, errors: { phone: t.validation.phone } };
  if (hasInsult(parsed.data.firstName, parsed.data.lastName, parsed.data.address, parsed.data.note)) {
    console.warn("placeOrder refused: insult in the form");
    return { ok: false, message: t.checkout.serverError };
  }

  // A delegation sent by a page opened before the form changed is kept only if it is Maystro's
  // for that governorate; otherwise the shop picks it when sending the parcel.
  if (parsed.data.communeId) {
    const commune = findCommune((await getCommunes()) ?? [], parsed.data.communeId, parsed.data.governorate);
    parsed.data.communeId = commune?.id;
    parsed.data.city = commune?.name ?? parsed.data.city;
  }

  try {
    const requestHeaders = await headers();
    const ip = clientIp(requestHeaders);
    const ipHash = hashIp(ip);
    if (await isBlockedConnection(ipHash)) {
      console.warn("placeOrder refused: blocked connection");
      return { ok: false, message: t.checkout.serverError };
    }

    // No ticket, a forged or stale one, or one already used: the form gets a fresh ticket and the
    // customer presses again (a person never notices more than that).
    const nonce = checkTicket(raw.ticket);
    if (!nonce || !(await hit(db, { key: `ticket:${nonce}`, max: 1, windowMs: TICKET_LIFETIME_MS })).allowed) {
      console.warn("placeOrder refused: missing or reused ticket");
      return { ok: false, message: t.checkout.tryAgain, newTicket: true };
    }

    for (const limit of orderLimits(ip)) {
      if (!(await hit(db, limit)).allowed) return { ok: false, message: t.checkout.tooManyOrders };
    }

    const settings = await getSettings();
    const result = await createOrder(db, parsed.data, settings.deliveryFee, { ipHash });
    if (!result.ok) {
      const e = t.orderErrors;
      const message =
        result.code === "stock" && result.detail
          ? fill(result.detail.left > 0 ? e.stock : e.soldOut, { name: result.detail.name, n: result.detail.left })
          : e[result.code === "stock" ? "unavailable" : result.code];
      return {
        ok: false,
        message,
        // Stock/availability changed: re-sync the cart. A key already used by another order: retry with a fresh one.
        refreshCart: result.code === "stock" || result.code === "unavailable",
        newKey: result.code === "conflict",
      };
    }
    // Store pages are pre-rendered; refresh them so stock levels stay accurate.
    revalidatePath("/[lang]", "layout");
    // Phone alert for the shop, sent after the customer gets their answer (a resubmit is not a new order).
    if (!result.duplicate) {
      after(() => notifyNewOrder(result.publicToken));
      // The checkout this order came from is no longer "abandoned".
      const leadKey = typeof input === "object" && input && "leadKey" in input ? String((input as { leadKey?: unknown }).leadKey ?? "").slice(0, 64) : "";
      after(async () => {
        const [placed] = await db.select({ id: orders.id }).from(orders).where(eq(orders.publicToken, result.publicToken)).limit(1);
        if (placed) await markLeadConverted(placed.id, parsed.data.phone, leadKey || null);
      });
      // The sale also goes to Meta from the server (the browser Pixel can be blocked).
      const cookieStore = await cookies();
      const browser = {
        ip: ip === "local" ? null : ip,
        userAgent: requestHeaders.get("user-agent"),
        fbp: cookieStore.get("_fbp")?.value ?? null,
        fbc: cookieStore.get("_fbc")?.value ?? null,
      };
      after(() => sendPurchaseToMeta(result.publicToken, locale, browser));
    }
    return { ok: true, token: result.publicToken };
  } catch (err) {
    console.error("placeOrder failed", err);
    return { ok: false, message: t.checkout.serverError };
  }
}

// Started checkouts: at most 40 saves per IP per 10 minutes (the form saves as the customer types).
const leadLimit = (ip: string) => ({ key: `lead:ip:${ip}`, max: 40, windowMs: 10 * 60 * 1000 });

/**
 * Called by the order form once the customer has typed a valid phone number (then as they fill
 * in the rest), so the shop can call back someone who stopped before "confirm order".
 * Answers nothing useful to the browser on purpose; failures are only logged.
 */
export async function saveCheckoutLead(input: unknown): Promise<void> {
  const lead = parseLeadInput(input);
  if (!lead || isFakePhone(lead.phone) || hasInsult(lead.fullName, lead.address)) return;
  try {
    const ip = clientIp(await headers());
    if (await isBlockedConnection(hashIp(ip))) return;
    const { allowed } = await hit(db, leadLimit(ip));
    if (!allowed) return;
    const { created } = await saveLead(lead);
    if (created) after(() => notifyNewLead(created));
  } catch (err) {
    console.error("saveCheckoutLead failed", err);
  }
}

/** Fresh prices and stock for the products in a browser-saved cart. */
export async function refreshCart(productIds: unknown, lang?: unknown) {
  if (!Array.isArray(productIds)) return [];
  const ids = productIds.filter((n): n is number => Number.isInteger(n) && n > 0).slice(0, 30);
  return getCartSnapshot(ids, isLocale(lang) ? lang : "ar");
}
