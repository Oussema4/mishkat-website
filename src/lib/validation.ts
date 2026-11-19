import { z } from "zod";
import { ar, fill, type Dictionary } from "@/i18n/ar";
import { GOVERNORATES, normalizeTunisianPhone } from "./tunisia";

const trimmed = (min: number, max: number, minMsg: string, maxMsg: string) => z.string().trim().min(min, minMsg).max(max, maxMsg);

export const MAX_QTY_PER_ITEM = 20;
export const MAX_ITEMS_PER_ORDER = 20;

/** The checkout form's rules, with messages in the shopper's language. */
export function checkoutSchemaFor(m: Dictionary["validation"]) {
  return z.object({
    firstName: trimmed(2, 60, m.firstName, m.tooLong),
    // The form asks for the name in one field (see splitFullName); a one-word name is accepted.
    lastName: z.string().trim().max(60, m.tooLong).optional().default(""),
    phone: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const n = normalizeTunisianPhone(v);
        if (!n) {
          ctx.addIssue({ code: "custom", message: m.phone });
          return z.NEVER;
        }
        return n;
      }),
    governorate: z.enum(GOVERNORATES, { error: m.governorate }),
    // The customer gives the governorate and a written address; the delegation (Maystro needs it)
    // is picked by the shop when sending the parcel. Still accepted from pages opened before.
    city: z.string().trim().max(80, m.tooLong).optional().default(""),
    communeId: z.number().int().positive().optional(),
    address: trimmed(5, 300, m.address, m.tooLong),
    note: z.string().trim().max(500, m.noteTooLong).optional().default(""),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM, fill(m.maxPerItem, { n: MAX_QTY_PER_ITEM })),
        }),
      )
      .min(1, m.emptyCart)
      .max(30)
      // One order can't take the whole stock: larger quantities go through WhatsApp.
      .refine((items) => items.reduce((n, i) => n + i.quantity, 0) <= MAX_ITEMS_PER_ORDER, {
        message: fill(m.maxPerOrder, { n: MAX_ITEMS_PER_ORDER }),
      }),
    idempotencyKey: z.string().min(16).max(64),
  });
}

export const checkoutSchema = checkoutSchemaFor(ar.validation);

/** "Name and surname" typed in one field → first word, then the rest (the courier gets both). */
export function splitFullName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

/** Flattens zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
