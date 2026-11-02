import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { buildParcel, cleanCommunes, shopStatusFor, type Commune } from "@/lib/maystro";
import { siteUrl } from "@/lib/site";
import type { Governorate } from "@/lib/tunisia";
import { changeOrderStatus } from "@/server/order-core";

/**
 * Maystro Tunisia API (https://tn.omnistro.com). Server only: the merchant token (MAYSTRO_TOKEN,
 * set in Vercel) never reaches the browser, logs or error messages.
 * Mode used: the shop confirms orders itself, then each one becomes a Maystro delivery order.
 */
const BASE = "https://tn.omnistro.com";

export function maystroEnabled() {
  return Boolean(process.env.MAYSTRO_TOKEN?.trim());
}

class MaystroError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = process.env.MAYSTRO_TOKEN?.trim();
  if (!token) throw new MaystroError(0, "Maystro غير مربوط: ينقص MAYSTRO_TOKEN في Vercel.");
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new MaystroError(0, "تعذّر الاتصال بـ Maystro (انقطاع أو مهلة).");
  }
  const text = await res.text();
  if (!res.ok) throw new MaystroError(res.status, `Maystro ردّ بـ ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

type Page<T> = { count: number; next: string | null; results: T[] };

async function allPages<T>(path: string, maxPages = 10): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const data = await call<Page<T>>(`${path}${sep}page=${page}`);
    out.push(...data.results);
    if (!data.next) break;
  }
  return out;
}

// ───────────── Reference data ─────────────

/** Tunisian delegations for the checkout. Public data, cached for a day; null if Maystro is unreachable. */
export async function getCommunes(): Promise<Commune[] | null> {
  try {
    const res = await fetch(`${BASE}/api/base/communes/`, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const list = cleanCommunes(await res.json());
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

export type MaystroProduct = { id: string; name: string; displayId: number | null };

/** The store's products at Maystro, to link each website product to one. */
export async function listMaystroProducts(): Promise<MaystroProduct[]> {
  const rows = await allPages<{ id: string; logistical_description?: string; display_id?: number; deleted?: boolean }>("/api/store/products/");
  return rows.filter((p) => !p.deleted).map((p) => ({ id: p.id, name: p.logistical_description || p.id, displayId: p.display_id ?? null }));
}

/** Read-only connection check for the dashboard. */
export async function checkConnection() {
  const checks: { label: string; ok: boolean; detail?: string }[] = [];
  const run = async (label: string, path: string) => {
    try {
      const data = await call<Page<unknown> | unknown[]>(path);
      const n = Array.isArray(data) ? data.length : data.count;
      checks.push({ label, ok: true, detail: `${n}` });
    } catch (err) {
      checks.push({ label, ok: false, detail: err instanceof MaystroError ? String(err.status || "") : "" });
    }
  };
  await run("المنتجات", "/api/store/products/?page=1");
  await run("الطرود", "/api/orders/?page=1");
  await run("أنواع الـ webhooks", "/api/stores/hooks/types/");
  return checks;
}

// ───────────── Delivery orders ─────────────

type MaystroOrder = { id: string; display_id?: string | number; external_id?: string | null; status?: number | string };

async function findByExternalId(reference: string): Promise<MaystroOrder | null> {
  const data = await call<Page<MaystroOrder>>(`/api/orders/?display_id_or_external_id=${encodeURIComponent(reference)}`);
  const matches = data.results.filter((o) => String(o.external_id ?? "") === reference);
  if (matches.length > 1) throw new MaystroError(0, `يوجد أكثر من طرد بنفس الرقم ${reference} في Maystro. راجعه يدويًا.`);
  return matches[0] ?? null;
}

const statusCode = (s: MaystroOrder["status"]) => (typeof s === "number" ? s : Number.isFinite(Number(s)) ? Number(s) : null);

async function saveParcel(orderId: number, parcel: MaystroOrder) {
  await db
    .update(orders)
    .set({
      maystroState: "sent",
      maystroOrderId: parcel.id,
      maystroTracking: parcel.display_id === undefined ? null : String(parcel.display_id),
      maystroStatus: statusCode(parcel.status),
      maystroError: null,
      maystroSyncedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

async function saveFailure(orderId: number, message: string) {
  await db.update(orders).set({ maystroState: "failed", maystroError: message.slice(0, 500) }).where(eq(orders.id, orderId));
}

export type SendResult = { ok: true; tracking: string | null } | { ok: false; message: string };

/**
 * Creates the Maystro delivery order for a shop order, once. Looks the reference up first, so a
 * retry after a timeout links the parcel that was already created instead of making a second one.
 */
export async function sendOrderToMaystro(orderId: number): Promise<SendResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, message: "الطلب غير موجود." };
  if (order.maystroState === "sent") return { ok: true, tracking: order.maystroTracking };

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const ids = items.map((i) => i.productId).filter((n): n is number => n !== null);
  const links = ids.length ? await db.select({ id: products.id, maystroProductId: products.maystroProductId }).from(products).where(inArray(products.id, ids)) : [];
  const parcel = buildParcel(
    { ...order, governorate: order.governorate as Governorate },
    items.map((i) => ({ productName: i.productName, quantity: i.quantity, maystroProductId: links.find((l) => l.id === i.productId)?.maystroProductId ?? null })),
  );
  if (!parcel.ok) {
    await saveFailure(orderId, parcel.error);
    return { ok: false, message: parcel.error };
  }

  try {
    const existing = await findByExternalId(order.reference);
    if (existing) {
      await saveParcel(orderId, existing);
      return { ok: true, tracking: existing.display_id === undefined ? null : String(existing.display_id) };
    }
    const created = await call<MaystroOrder>("/api/orders/", { method: "POST", body: parcel.body });
    await saveParcel(orderId, created);
    return { ok: true, tracking: created.display_id === undefined ? null : String(created.display_id) };
  } catch (err) {
    // Unclear result (timeout, 5xx): the parcel may exist. The next attempt searches before creating.
    const message = err instanceof MaystroError ? err.message : "خطأ غير متوقّع مع Maystro.";
    if (!(err instanceof MaystroError)) console.error("Maystro send failed", err);
    await saveFailure(orderId, message);
    return { ok: false, message };
  }
}

/**
 * Re-reads the parcel from Maystro (the source of truth) and moves the shop status forward
 * when it should: out with the driver → shipped, delivered → delivered.
 */
export async function syncOrderFromMaystro(orderId: number): Promise<SendResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order?.maystroOrderId) return { ok: false, message: "هذا الطلب لم يُرسل إلى Maystro بعد." };
  try {
    const parcel = await call<MaystroOrder>(`/api/orders/${encodeURIComponent(order.maystroOrderId)}/`);
    await saveParcel(orderId, parcel);
    const code = statusCode(parcel.status);
    const next = code === null ? null : shopStatusFor(code);
    if (next && next !== order.status && !(next === "shipped" && order.status === "delivered")) {
      await changeOrderStatus(db, orderId, next, { id: null, name: "Maystro" });
    }
    return { ok: true, tracking: order.maystroTracking };
  } catch (err) {
    const message = err instanceof MaystroError ? err.message : "خطأ غير متوقّع مع Maystro.";
    if (!(err instanceof MaystroError)) console.error("Maystro sync failed", err);
    return { ok: false, message };
  }
}

/** The shop order a webhook is about: by parcel id, else by our reference sent as external_id. */
export async function findOrderForWebhook(parcelId: string | null, externalId: string | null) {
  if (parcelId) {
    const [o] = await db.select({ id: orders.id }).from(orders).where(eq(orders.maystroOrderId, parcelId)).limit(1);
    if (o) return o.id;
  }
  if (externalId) {
    const [o] = await db.select({ id: orders.id }).from(orders).where(eq(orders.reference, externalId)).limit(1);
    if (o) return o.id;
  }
  return null;
}

// ───────────── Webhook ─────────────

/** Secret part of the webhook URL, derived from AUTH_SECRET (so there is no extra variable to manage). */
export function webhookSecret() {
  const key = process.env.AUTH_SECRET;
  if (!key) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", key).update("maystro-webhook-v1").digest("hex").slice(0, 40);
}

/** The address Maystro calls for every parcel update (it carries the secret: show it to admins only). */
export function maystroWebhookUrl() {
  return `${siteUrl()}/api/maystro/webhook/${webhookSecret()}`;
}

export function isWebhookSecret(candidate: string) {
  const expected = Buffer.from(webhookSecret());
  const given = Buffer.from(candidate);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

type Hook = { id: number | string; endpoint?: string };
type HookType = { id: number | string; name: string };

/** Subscribes the webhook URL to every Maystro event, unless it already is. */
export async function registerWebhook(url: string): Promise<{ ok: boolean; message: string }> {
  try {
    const hooks = await allPages<Hook>("/api/stores/hooks/costume/");
    if (hooks.some((h) => h.endpoint === url)) return { ok: true, message: "الـ webhook مسجّل من قبل." };
    const types = await call<HookType[] | Page<HookType>>("/api/stores/hooks/types/");
    const all = (Array.isArray(types) ? types : types.results).find((t) => t.name === "all");
    if (!all) return { ok: false, message: "Maystro لم يرجع نوع الحدث «all»." };
    await call("/api/stores/hooks/costume/", { method: "POST", body: { endpoint: url, trigger_type_id: all.id } });
    return { ok: true, message: "تم تسجيل الـ webhook." };
  } catch (err) {
    return { ok: false, message: err instanceof MaystroError ? err.message : "خطأ غير متوقّع مع Maystro." };
  }
}
