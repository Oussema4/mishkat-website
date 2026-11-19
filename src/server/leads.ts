import "server-only";
import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { checkoutLeads, orders, products, type LeadItem } from "@/db/schema";
import { bundleTotal } from "@/lib/pricing";
import { splitFullName } from "@/lib/validation";
import { GOVERNORATES, normalizeTunisianPhone } from "@/lib/tunisia";

/**
 * Checkouts started but maybe not finished ("ما كمّلوش" in the dashboard). A lead is saved once
 * the customer has typed a valid phone number, and marked as converted when the order arrives.
 */

/** A started checkout with no order after this long counts as abandoned. */
export const ABANDONED_AFTER_MS = 15 * 60_000;

export type LeadInput = {
  key: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  items: { productId: number; quantity: number }[];
  locale: string;
};

/** Reads what the browser sent; null when it isn't a usable lead (no valid phone yet…). */
export function parseLeadInput(raw: unknown): LeadInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const key = text(r.key, 64);
  const phone = normalizeTunisianPhone(text(r.phone, 20));
  if (key.length < 16 || !phone) return null;
  const governorate = text(r.governorate, 40);
  const items = Array.isArray(r.items)
    ? r.items
        .slice(0, 30)
        .map((i) => ({ productId: Number((i as { productId?: unknown })?.productId), quantity: Number((i as { quantity?: unknown })?.quantity) }))
        .filter((i) => Number.isInteger(i.productId) && i.productId > 0 && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20)
    : [];
  return {
    key,
    fullName: text(r.fullName, 120),
    phone,
    governorate: (GOVERNORATES as readonly string[]).includes(governorate) ? governorate : "",
    city: text(r.city, 80),
    address: text(r.address, 300),
    items,
    locale: text(r.locale, 5) || "ar",
  };
}

/** Saves or updates the lead; returns its id when it was just created (to send the alert once). */
export async function saveLead(input: LeadInput): Promise<{ created: number | null }> {
  // Names and prices from the catalogue (the browser only says which product and how many).
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const catalog = ids.length ? await db.select({ id: products.id, name: products.name, price: products.price, bundles: products.bundles }).from(products).where(inArray(products.id, ids)) : [];
  const items: LeadItem[] = input.items.flatMap((i) => {
    const p = catalog.find((c) => c.id === i.productId);
    return p ? [{ productId: p.id, name: p.name, quantity: i.quantity, lineTotal: bundleTotal(p.price, i.quantity, p.bundles) }] : [];
  });
  const { firstName, lastName } = splitFullName(input.fullName);
  const values = {
    firstName,
    lastName,
    phone: input.phone,
    governorate: input.governorate,
    city: input.city,
    address: input.address,
    items,
    subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
    locale: input.locale,
    updatedAt: new Date(),
  };

  const [existing] = await db.select({ id: checkoutLeads.id, orderId: checkoutLeads.orderId }).from(checkoutLeads).where(eq(checkoutLeads.key, input.key)).limit(1);
  if (existing) {
    if (!existing.orderId) await db.update(checkoutLeads).set(values).where(eq(checkoutLeads.id, existing.id));
    return { created: null };
  }
  // The same phone ordered a moment ago (another tab, a second form): nothing was abandoned.
  const [recentOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.phone, input.phone), gte(orders.createdAt, new Date(Date.now() - 30 * 60_000))))
    .limit(1);
  const [row] = await db
    .insert(checkoutLeads)
    .values({ key: input.key, ...values, orderId: recentOrder?.id ?? null })
    .onConflictDoNothing()
    .returning({ id: checkoutLeads.id });
  return { created: row && !recentOrder ? row.id : null };
}

/** The order came in: the checkout it came from (same form, or same phone in the last day) is done. */
export async function markLeadConverted(orderId: number, phone: string, key: string | null) {
  await db
    .update(checkoutLeads)
    .set({ orderId, updatedAt: new Date() })
    .where(
      and(
        isNull(checkoutLeads.orderId),
        or(key ? eq(checkoutLeads.key, key) : undefined, and(eq(checkoutLeads.phone, phone), gte(checkoutLeads.createdAt, new Date(Date.now() - 24 * 3_600_000)))),
      ),
    );
}
