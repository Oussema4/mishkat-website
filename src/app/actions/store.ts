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
import { getCommunes } from "@/server/maystro";
import { sendPurchaseToMeta } from "@/server/meta-capi";
import { markLeadConverted, parseLeadInput, saveLead } from "@/server/leads";
import { notifyNewLead, notifyNewOrder } from "@/server/notify";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSettings } from "@/server/settings";

export type PlaceOrderResult =
  | { ok: true; token: string }
  | { ok: false; errors?: Record<string, string>; message?: string; refreshCart?: boolean; newKey?: boolean };

// Abuse guard shared by every server instance (counted in the database): max 8 orders per IP per
// 10 minutes. Open orders per phone number are capped in createOrder.
const orderLimit = (ip: string) => ({ key: `order:ip:${ip}`, max: 8, windowMs: 10 * 60 * 1000 });

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

  const parsed = checkoutSchemaFor(t.validation).safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

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
    const { allowed } = await hit(db, orderLimit(ip));
    if (!allowed) {
      return { ok: false, message: t.checkout.tooManyOrders };
    }

    const settings = await getSettings();
    const result = await createOrder(db, parsed.data, settings.deliveryFee);
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
  if (!lead) return;
  try {
    const { allowed } = await hit(db, leadLimit(clientIp(await headers())));
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
