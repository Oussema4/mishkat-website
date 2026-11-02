/**
 * Maystro Tunisia (delivery): reference data, status codes and the parcel sent for an order.
 * Pure functions only, shared by the checkout, the dashboard and the server client
 * (src/server/maystro.ts). Spec: Maystro's integration guide for tn.omnistro.com.
 */
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

/**
 * The shop's own status that follows a Maystro status, when it should move on its own:
 * out with the driver → shipped, delivered → delivered. Refusals and returns are left to the
 * shop to decide (cancelling puts items back in the website's stock).
 */
export function shopStatusFor(code: number): "shipped" | "delivered" | null {
  if (code === 41) return "delivered";
  if ([22, 31, 32, 42].includes(code)) return "shipped";
  return null;
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
  if (!order.communeId) return { ok: false, error: "المعتمدية غير محدّدة في هذا الطلب. عدّلها في Maystro أو أرسل الطلب يدويًا." };
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
