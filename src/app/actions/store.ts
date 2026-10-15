"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ar } from "@/i18n/ar";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { getCartSnapshot } from "@/server/catalog";
import { createOrder } from "@/server/order-core";
import { getSettings } from "@/server/settings";

export type PlaceOrderResult =
  | { ok: true; token: string }
  | { ok: false; errors?: Record<string, string>; message?: string; refreshCart?: boolean };

// Best-effort abuse guard (per server instance): max 8 orders per IP per 10 minutes.
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= 8) return true;
  hits.push(now);
  recent.set(ip, hits);
  return false;
}

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  // Honeypot: real customers never fill this hidden field.
  if (typeof input === "object" && input && "company" in input && (input as { company?: string }).company) {
    return { ok: false, message: ar.checkout.serverError };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (rateLimited(ip)) {
    return { ok: false, message: "أرسلت عدة طلبات خلال وقت قصير. انتظر بضع دقائق أو راسلنا على واتساب." };
  }

  try {
    const settings = await getSettings();
    const result = await createOrder(db, parsed.data, settings.deliveryFee);
    if (!result.ok) return { ok: false, message: result.message, refreshCart: true };
    // Store pages are pre-rendered; refresh them so stock levels stay accurate.
    revalidatePath("/", "layout");
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
