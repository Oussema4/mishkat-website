"use client";

import { MapPin, Pencil } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { CopyButton } from "@/components/admin/copy-button";
import { adminInput, FormMessage, keepValuesOnSubmit, SubmitButton } from "@/components/admin/form-bits";
import { MAYSTRO_WILAYAS, type Commune } from "@/lib/maystro";
import { cn } from "@/lib/site";
import { formatTunisianPhone, GOVERNORATES, type Governorate } from "@/lib/tunisia";
import { updateOrderCustomer, type FormState } from "../../../actions";

type Customer = {
  firstName: string;
  lastName: string;
  phone: string;
  governorate: string;
  city: string;
  communeId: number | null;
  address: string;
  note: string;
};

/**
 * The customer block of an order. While the order is "new" (not confirmed yet) the details can
 * be corrected here: a wrong number, a missing surname, the address… The delegation is optional
 * here (Maystro needs it: it can also be picked when sending the parcel).
 */
export function CustomerDetails({ orderId, customer, editable, communes }: { orderId: number; customer: Customer; editable: boolean; communes: Commune[] | null }) {
  const [editing, setEditing] = useState(false);
  const [state, action, saving] = useActionState<FormState, FormData>(updateOrderCustomer, {});
  const [governorate, setGovernorate] = useState(customer.governorate);
  const [communeId, setCommuneId] = useState(customer.communeId ? String(customer.communeId) : "");
  const wilaya = MAYSTRO_WILAYAS[governorate as Governorate]?.code;
  const cityOptions = communes && wilaya ? communes.filter((c) => c.wilaya === wilaya) : [];

  // Saved: back to the read view (the page itself is refreshed by the action).
  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">الاسم واللقب</dt>
            <dd className="text-lg font-semibold">
              {customer.firstName} {customer.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">الهاتف</dt>
            <dd className="flex items-center gap-1">
              <span dir="ltr" className="text-lg font-semibold tabular">
                {formatTunisianPhone(customer.phone)}
              </span>
              <CopyButton value={customer.phone} label="انسخ رقم الهاتف" />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted">العنوان</dt>
            <dd className="flex gap-2 leading-7">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-gold-deep" />
              <span>{[customer.address, customer.city, customer.governorate].filter(Boolean).join("، ")}</span>
            </dd>
          </div>
          {customer.note ? (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted">ملاحظة الزبون</dt>
              <dd className="rounded-[var(--radius-md)] bg-mist p-3 leading-7">{customer.note}</dd>
            </div>
          ) : null}
        </dl>
        {state.ok ? (
          <div className="mt-3">
            <FormMessage state={state} />
          </div>
        ) : null}
        {editable ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            <Pencil aria-hidden className="size-4" />
            تعديل معطيات الحريف
          </button>
        ) : null}
      </>
    );
  }

  const label = "mb-1 block text-sm text-muted";
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="mt-4 space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>الاسم</span>
          <input name="firstName" defaultValue={customer.firstName} required maxLength={60} className={adminInput} />
        </label>
        <label className="block">
          <span className={label}>اللقب</span>
          <input name="lastName" defaultValue={customer.lastName} maxLength={60} className={adminInput} />
        </label>
        <label className="block">
          <span className={label}>الهاتف</span>
          <input name="phone" defaultValue={customer.phone} required inputMode="tel" dir="ltr" maxLength={20} className={cn(adminInput, "text-end tabular")} />
        </label>
        <label className="block">
          <span className={label}>الولاية</span>
          <select
            name="governorate"
            value={governorate}
            onChange={(e) => {
              setGovernorate(e.target.value);
              setCommuneId("");
            }}
            className={adminInput}
          >
            {GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>المعتمدية (لـ Maystro، اختياري)</span>
          {communes ? (
            <select name="communeId" value={communeId} onChange={(e) => setCommuneId(e.target.value)} className={adminInput}>
              <option value="">— ما تختارتش —</option>
              {cityOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input name="city" defaultValue={customer.city} maxLength={80} className={adminInput} />
          )}
        </label>
        <label className="block">
          <span className={label}>العنوان</span>
          <input name="address" defaultValue={customer.address} required minLength={5} maxLength={300} className={adminInput} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>ملاحظة (اختياري)</span>
          <textarea name="note" defaultValue={customer.note} rows={2} maxLength={500} className={cn(adminInput, "resize-y")} />
        </label>
      </div>
      <FormMessage state={state.ok ? {} : state} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={saving}>حفظ التعديلات</SubmitButton>
        <button type="button" onClick={() => setEditing(false)} className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-4 font-medium text-muted hover:bg-mist">
          إلغاء
        </button>
      </div>
    </form>
  );
}
