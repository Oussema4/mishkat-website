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
    lastName: trimmed(2, 60, m.lastName, m.tooLong),
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
    city: trimmed(2, 80, m.city, m.tooLong),
    /** Maystro delegation id from the checkout list (absent when the list couldn't be loaded). */
    communeId: z.number().int().positive().optional(),
    // No street address at checkout (governorate + city are enough; the courier calls before delivery).
    // Still accepted from older pages, and the dashboard shows it when present.
    address: z.string().trim().max(300, m.tooLong).optional().default(""),
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
