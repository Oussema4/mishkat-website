"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ar } from "@/i18n/ar";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { getCartSnapshot } from "@/server/catalog";
import { createOrder } from "@/server/order-core";
import { clientIp, hit } from "@/server/rate-limit";
import { notifyNewOrder } from "@/server/notify";
import { getSettings } from "@/server/settings";

export type PlaceOrderResult =
  | { ok: true; token: string }
  | { ok: false; errors?: Record<string, string>; message?: string; refreshCart?: boolean; newKey?: boolean };

// Abuse guard shared by every server instance (counted in the database): max 8 orders per IP per
// 10 minutes. Open orders per phone number are capped in createOrder.
const orderLimit = (ip: string) => ({ key: `order:ip:${ip}`, max: 8, windowMs: 10 * 60 * 1000 });

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  // Honeypot: real customers never fill this hidden field.
  if (typeof input === "object" && input && "company" in input && (input as { company?: string }).company) {
    return { ok: false, message: ar.checkout.serverError };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    const { allowed } = await hit(db, orderLimit(clientIp(await headers())));
    if (!allowed) {
      return { ok: false, message: "أرسلت عدة طلبات خلال وقت قصير. انتظر بضع دقائق أو راسلنا على واتساب." };
    }

    const settings = await getSettings();
    const result = await createOrder(db, parsed.data, settings.deliveryFee);
    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
        // Stock/availability changed: re-sync the cart. A key already used by another order: retry with a fresh one.
        refreshCart: result.code === "stock" || result.code === "unavailable",
        newKey: result.code === "conflict",
      };
    }
    // Store pages are pre-rendered; refresh them so stock levels stay accurate.
    revalidatePath("/", "layout");
    // Phone alert for the shop, sent after the customer gets their answer (a resubmit is not a new order).
    if (!result.duplicate) after(() => notifyNewOrder(result.publicToken));
    return { ok: true, token: result.publicToken };
  } catch (err) {
    console.error("placeOrder failed", err);
    return { ok: false, message: ar.checkout.serverError };
  }
}

/** Fresh prices and stock for the products in a browser-saved cart. */
export async function refreshCart(productIds: unknown) {
  if (!Array.isArray(productIds)) return [];
  const ids = productIds.filter((n): n is number => Number.isInteger(n) && n > 0).slice(0, 30);
  return getCartSnapshot(ids);
}
