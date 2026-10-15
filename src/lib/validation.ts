import { z } from "zod";
import { GOVERNORATES, normalizeTunisianPhone } from "./tunisia";

const trimmed = (min: number, max: number, minMsg: string, maxMsg = "النص طويل جدًا") =>
  z.string().trim().min(min, minMsg).max(max, maxMsg);

export const MAX_QTY_PER_ITEM = 20;

export const checkoutSchema = z.object({
  firstName: trimmed(2, 60, "اكتب اسمك (حرفان على الأقل)"),
  lastName: trimmed(2, 60, "اكتب لقبك (حرفان على الأقل)"),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = normalizeTunisianPhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "اكتب رقم هاتف تونسي من 8 أرقام، مثل 92 123 456" });
        return z.NEVER;
      }
      return n;
    }),
  governorate: z.enum(GOVERNORATES, { error: "اختر ولايتك من القائمة" }),
  city: trimmed(2, 80, "اكتب المدينة أو المنطقة"),
  address: trimmed(6, 300, "اكتب العنوان بالتفصيل (الشارع، رقم المنزل، علامة قريبة)"),
  note: z.string().trim().max(500, "الملاحظة طويلة جدًا").optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM, `الحد الأقصى ${MAX_QTY_PER_ITEM} قطعة لكل منتج`),
      }),
    )
    .min(1, "سلتك فارغة")
    .max(30),
  idempotencyKey: z.string().min(16).max(64),
});

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
