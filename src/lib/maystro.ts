/**
 * Maystro Tunisia (delivery): reference data, status codes and the parcel sent for an order.
 * Pure functions only, shared by the checkout, the dashboard and the server client
 * (src/server/maystro.ts). Spec: Maystro's integration guide for tn.omnistro.com.
 */
import type { OrderStatus } from "@/db/schema";
import type { Governorate } from "./tunisia";

/** Maystro's code and Latin name for each governorate (Tunisian wilayas are codes 59–82). */
export const MAYSTRO_WILAYAS: Record<Governorate, { code: number; name: string }> = {
  "تونس": { code: 80, name: "Tunis" },
  "أريانة": { code: 59, name: "Ariana" },
  "بن عروس": { code: 61, name: "Ben Arous" },
  "منوبة": { code: 71, name: "Manouba" },
  "نابل": { code: 74, name: "Nabeul" },
  "زغوان": { code: 82, name: "Zaghouan" },
  "بنزرت": { code: 62, name: "Bizerte" },
  "باجة": { code: 60, name: "Béja" },
  "جندوبة": { code: 65, name: "Jendouba" },
  "الكاف": { code: 69, name: "Kef" },
  "سليانة": { code: 77, name: "Siliana" },
  "سوسة": { code: 78, name: "Sousse" },
  "المنستير": { code: 73, name: "Monastir" },
  "المهدية": { code: 70, name: "Mahdia" },
  "صفاقس": { code: 75, name: "Sfax" },
  "القيروان": { code: 66, name: "Kairouan" },
  "القصرين": { code: 67, name: "Kasserine" },
  "سيدي بوزيد": { code: 76, name: "Sidi Bouzid" },
  "قابس": { code: 63, name: "Gabès" },
  "مدنين": { code: 72, name: "Medenine" },
  "تطاوين": { code: 81, name: "Tataouine" },
  "قفصة": { code: 64, name: "Gafsa" },
  "توزر": { code: 79, name: "Tozeur" },
  "قبلي": { code: 68, name: "Kebili" },
};

/** A delegation as the checkout offers it: Maystro id, display name, governorate code. */
export type Commune = { id: number; name: string; wilaya: number };

/**
 * Maystro's commune list → Tunisian delegations only, one entry per name within a governorate
 * (their list repeats a few names; the lowest id is kept), sorted by name.
 */
export function cleanCommunes(raw: unknown): Commune[] {
  if (!Array.isArray(raw)) return [];
  const best = new Map<string, Commune>();
  for (const item of raw) {
    const c = item as { id?: unknown; name?: unknown; commune_ar?: unknown; wilaya?: unknown };
    if (typeof c.id !== "number" || typeof c.wilaya !== "number" || c.wilaya < 59 || c.wilaya > 82) continue;
    const name = (typeof c.commune_ar === "string" && c.commune_ar.trim()) || (typeof c.name === "string" ? c.name.trim() : "");
    if (!name) continue;
    const key = `${c.wilaya}:${name.toLowerCase()}`;
    const kept = best.get(key);
    if (!kept || c.id < kept.id) best.set(key, { id: c.id, name, wilaya: c.wilaya });
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** The delegation for this id, only if it belongs to the chosen governorate. */
export function findCommune(communes: Commune[], id: number, governorate: Governorate): Commune | null {
  const c = communes.find((x) => x.id === id);
  return c && c.wilaya === MAYSTRO_WILAYAS[governorate].code ? c : null;
}

/** The main delegation of each governorate (its centre), by Maystro's governorate code. */
const CENTRE: Record<number, string> = {
  80: "Bab Bhar", 59: "Ariana Ville", 61: "Ben Arous", 71: "Mannouba", 74: "Nabeul", 82: "Zaghouan",
  62: "Bizerte Nord", 60: "Beja Nord", 65: "Jendouba", 69: "Le Kef Est", 77: "Siliana Nord", 78: "Sousse Ville",
  73: "Monastir", 70: "Mahdia", 75: "Sfax Ville", 66: "Kairouan Nord", 67: "Kasserine Nord", 76: "Sidi Bouzid Ouest",
  63: "Gabes Medina", 72: "Medenine Nord", 81: "Tataouine Nord", 64: "Gafsa Nord", 79: "Tozeur", 68: "Kebili Nord",
};
const plain = (s: string) => ` ${s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;

/**
 * Customers give no delegation, and Maystro needs one: the delegation named in the address when
 * there is one (longest name wins: "Hammam Sousse" before "Sousse"), else the governorate's centre.
 * The full address still goes to Maystro as the destination text.
 */
export function guessCommune(communes: Commune[], governorate: Governorate, address: string): Commune | null {
  const code = MAYSTRO_WILAYAS[governorate]?.code;
  const list = communes.filter((c) => c.wilaya === code);
  if (list.length === 0) return null;
  const text = plain(address);
  const named = list.filter((c) => text.includes(plain(c.name))).sort((a, b) => b.name.length - a.name.length)[0];
  return named ?? list.find((c) => plain(c.name) === plain(CENTRE[code] ?? "")) ?? list[0];
}

// ───────────── Delivery statuses ─────────────

/** Maystro delivery status → Arabic label for the dashboard, and whether it is final. */
export const MAYSTRO_STATUSES: Record<number, { label: string; final?: boolean }> = {
  4: { label: "قيد التجهيز" },
  5: { label: "قيد التجهيز" },
  6: { label: "قيد التجهيز" },
  8: { label: "في الطريق" },
  9: { label: "في الطريق" },
  10: { label: "في طريق الإرجاع" },
  11: { label: "قيد التجهيز" },
  12: { label: "متأخر: المنتج غير متوفر في المخزن" },
  15: { label: "جاهز للشحن" },
  22: { label: "مع الموزّع" },
  31: { label: "مع الموزّع" },
  32: { label: "محاولة توصيل: الموزّع سيتصل" },
  41: { label: "تم التسليم", final: true },
  42: { label: "تأجيل التوصيل" },
  50: { label: "ملغى أو مرفوض", final: true },
  51: { label: "جاهز للإرجاع" },
  52: { label: "رجع إلى المخزن", final: true },
  53: { label: "مشكل: اتصل بـ Maystro" },
};

export function maystroStatusLabel(code: number | null | undefined): string {
  if (code === null || code === undefined) return "—";
  return MAYSTRO_STATUSES[code]?.label ?? `حالة ${code}`;
}

const SHOP_STEP: Record<Exclude<OrderStatus, "cancelled">, number> = { new: 0, postponed: 0, confirmed: 1, preparing: 2, shipped: 3, delivered: 4 };

/**
 * The shop status an order moves to when Maystro reports `code`, or null to leave it as it is.
 * The shop status follows Maystro: being prepared → preparing, on the way or with the driver →
 * shipped, delivered → delivered, refused or back in the warehouse → cancelled (which puts the
 * boxes back in the website's stock). It only moves forward, a delivered order stays delivered,
 * and an order the shop cancelled is never reopened on its own.
 */
export function shopStatusFor(code: number, current: OrderStatus): OrderStatus | null {
  let target: OrderStatus | null = null;
  if (code === 41) target = "delivered";
  else if (code === 50 || code === 52) target = "cancelled";
  else if ([8, 9, 22, 31, 32, 42].includes(code)) target = "shipped";
  else if ([4, 5, 6, 11, 12, 15].includes(code)) target = "preparing";
  if (!target || target === current || current === "delivered" || current === "cancelled") return null;
  if (target === "cancelled") return target;
  return SHOP_STEP[target as keyof typeof SHOP_STEP] > SHOP_STEP[current] ? target : null;
}

// ───────────── Parcel ─────────────

export type ParcelOrder = {
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  governorate: Governorate;
  city: string;
  address: string;
  note: string;
  subtotal: number; // millimes
  total: number; // millimes, cash collected by the driver
  communeId: number | null;
};
export type ParcelLine = { productName: string; quantity: number; maystroProductId: string | null };

/** Maystro takes at most this many lines per parcel. */
export const MAX_PARCEL_LINES = 10;

const dinars = (millimes: number) => (millimes / 1000).toFixed(2);

/**
 * The delivery order sent to POST /api/orders/, or the reason it can't be sent yet.
 * `external_id` is the shop reference, so a retry can find a parcel already created.
 */
export function buildParcel(order: ParcelOrder, lines: ParcelLine[]): { ok: true; body: Record<string, unknown> } | { ok: false; error: string } {
  if (!order.communeId) return { ok: false, error: "ما نجمتش نجيب قائمة المعتمديات من Maystro. عاود جرّب بعد شويّة." };
  const unmapped = lines.filter((l) => !l.maystroProductId).map((l) => l.productName);
  if (unmapped.length > 0) return { ok: false, error: `منتج غير مربوط بـ Maystro: ${unmapped.join("، ")}. اربطه من صفحة المنتج.` };
  if (lines.length > MAX_PARCEL_LINES) return { ok: false, error: `الطلب فيه أكثر من ${MAX_PARCEL_LINES} منتجات مختلفة، وهذا أقصى ما يقبله Maystro.` };

  return {
    ok: true,
    body: {
      external_id: order.reference,
      customer_name: `${order.firstName} ${order.lastName}`.trim().slice(0, 100),
      customer_phone: order.phone,
      destination_text: [order.address, order.city, order.governorate].filter(Boolean).join("، ").slice(0, 250),
      commune: order.communeId,
      note_to_driver: order.note.slice(0, 250),
      product_name: lines.map((l) => `${l.quantity} ${l.productName}`).join(" + ").slice(0, 250),
      product_price: dinars(order.subtotal),
      total_price: dinars(order.total),
      express: false,
      delivery_type: 1,
      details: lines.map((l) => ({ product: l.maystroProductId, quantity: l.quantity })),
    },
  };
}

// ───────────── Webhooks ─────────────

/**
 * Maystro webhooks wrap the event as base64 JSON in `message.data`. Returns the parcel id and the
 * external id when present; the status itself is always re-read from the API, never trusted here.
 */
export function parseWebhook(body: unknown): { orderId: string | null; externalId: string | null; event: string | null } | null {
  const data = (body as { message?: { data?: unknown } })?.message?.data;
  if (typeof data !== "string") return null;
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return null;
  }
  if (!event || typeof event !== "object") return null;
  const nested = (event.order ?? event.data ?? {}) as Record<string, unknown>;
  const pick = (...values: unknown[]) => {
    for (const v of values) if ((typeof v === "string" && v) || typeof v === "number") return String(v);
    return null;
  };
  return {
    orderId: pick(event.order_id, event.id, event.uuid, nested.id, nested.order_id),
    externalId: pick(event.external_id, nested.external_id),
    event: pick(event.event, event.event_name, event.name, event.type),
  };
}
