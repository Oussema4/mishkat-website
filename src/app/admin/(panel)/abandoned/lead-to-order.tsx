"use client";

import { ShoppingBag } from "lucide-react";
import { useActionState, useState } from "react";
import { adminInput, FormMessage, keepValuesOnSubmit, SubmitButton } from "@/components/admin/form-bits";
import { formatTND } from "@/lib/money";
import { cn } from "@/lib/site";
import { GOVERNORATES } from "@/lib/tunisia";
import { convertLeadToOrder, type FormState } from "@/app/admin/actions";

type Lead = {
  id: number;
  fullName: string;
  phone: string;
  governorate: string;
  address: string;
  items: { productId: number; quantity: number }[];
};
type Product = { id: number; name: string; price: number };

/**
 * "The customer said yes on the phone": opens the details to check (name, governorate, address,
 * how many), then makes the order and goes to its page.
 */
export function LeadToOrder({ lead, products }: { lead: Lead; products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, saving] = useActionState<FormState, FormData>(convertLeadToOrder, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] bg-ink px-3 text-sm font-medium text-paper hover:bg-ink/85"
      >
        <ShoppingBag aria-hidden className="size-4" />
        قبل: حوّلو لطلب
      </button>
    );
  }

  // Quantities from the checkout; with no product chosen yet, one of the only product.
  const qty = (id: number) => lead.items.find((i) => i.productId === id)?.quantity ?? (lead.items.length === 0 && products.length === 1 ? 1 : 0);
  const label = "mb-1 block text-sm text-muted";
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="mt-2 w-full space-y-4 rounded-[var(--radius-md)] border border-line p-4">
      <input type="hidden" name="leadId" value={lead.id} />
      <p className="font-semibold">ثبّت المعطيات مع الحريف، من بعد اعمل الطلب</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>الاسم واللقب</span>
          <input name="fullName" defaultValue={lead.fullName} required minLength={2} maxLength={120} className={adminInput} />
        </label>
        <label className="block">
          <span className={label}>الهاتف</span>
          <input name="phone" defaultValue={lead.phone} required inputMode="tel" dir="ltr" maxLength={20} className={cn(adminInput, "text-end tabular")} />
        </label>
        <label className="block">
          <span className={label}>الولاية</span>
          <select name="governorate" defaultValue={lead.governorate} required className={adminInput}>
            <option value="" disabled>
              — اختار —
            </option>
            {GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>العنوان</span>
          <input name="address" defaultValue={lead.address} required minLength={5} maxLength={300} className={adminInput} />
        </label>
        {products.map((p) => (
          <label key={p.id} className="block">
            <span className={label}>
              {p.name} ({formatTND(p.price)} للوحدة) — قدّاش؟
            </span>
            <input type="hidden" name="productId" value={p.id} />
            <input name={`qty-${p.id}`} type="number" min={0} max={20} defaultValue={qty(p.id)} className={cn(adminInput, "tabular")} />
          </label>
        ))}
        <label className="block sm:col-span-2">
          <span className={label}>ملاحظة (اختياري)</span>
          <textarea name="note" rows={2} maxLength={500} className={cn(adminInput, "resize-y")} />
        </label>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={saving}>اعمل الطلب</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-4 font-medium text-muted hover:bg-mist">
          إلغاء
        </button>
      </div>
    </form>
  );
}
