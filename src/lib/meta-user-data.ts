import { createHash } from "node:crypto";
import { MAYSTRO_WILAYAS } from "@/lib/maystro";
import type { Governorate } from "@/lib/tunisia";

/**
 * Customer details for Meta's Conversions API, normalised and hashed (SHA-256) the way Meta
 * expects, so they can be matched to Meta accounts without ever leaving the server in clear.
 */
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Meta's normalisation for names and places: lowercase, no spaces or punctuation. */
export function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

/** Shop phones are 8 local digits; Meta wants them with the country code, digits only. */
export const normalizePhone = (phone: string) => `216${phone.replace(/\D/g, "").slice(-8)}`;

/** The hashed customer fields of one order (empty values are left out). */
export function hashedUserData(order: { firstName: string; lastName: string; phone: string; city: string; governorate: string }) {
  const hashed = (value: string) => (value ? [sha256(value)] : undefined);
  const phone = normalizePhone(order.phone);
  const state = MAYSTRO_WILAYAS[order.governorate as Governorate]?.name ?? order.governorate;
  return {
    ph: hashed(phone),
    external_id: hashed(phone),
    fn: hashed(normalizeText(order.firstName)),
    ln: hashed(normalizeText(order.lastName)),
    ct: hashed(normalizeText(order.city)),
    st: hashed(normalizeText(state)),
    country: hashed("tn"),
  };
}
