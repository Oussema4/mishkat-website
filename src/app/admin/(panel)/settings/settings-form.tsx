"use client";

import { useActionState } from "react";
import { AdminField, FormMessage, SubmitButton, adminInput, describe, keepValuesOnSubmit } from "@/components/admin/form-bits";
import { formatFaq, formatTNDInput } from "@/lib/admin-format";
import type { StoreSettings } from "@/lib/settings-schema";
import { saveStoreSettings, type FormState } from "../../actions";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveStoreSettings, {});
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="space-y-6">
      <Card title="التوصيل">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField id="deliveryFee" label="مصاريف التوصيل (د.ت)" hint="مبلغ واحد لكل الولايات" error={e.deliveryFee}>
            <input
              {...describe("deliveryFee", { hint: true, error: e.deliveryFee })}
              defaultValue={formatTNDInput(settings.deliveryFee)}
              inputMode="decimal"
              dir="ltr"
              required
              className={adminInput}
            />
          </AdminField>
          <AdminField id="deliveryTime" label="مدة التوصيل" hint="تظهر للزبون، مثلًا: 48 ساعة">
            <input {...describe("deliveryTime", { hint: true })} defaultValue={settings.deliveryTime} className={adminInput} />
          </AdminField>
        </div>
      </Card>

      <Card title="التواصل">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField id="whatsapp" label="رقم واتساب" hint="يُستعمل لأزرار واتساب. اتركه فارغًا لإخفائها." error={e.whatsapp}>
            <input {...describe("whatsapp", { hint: true, error: e.whatsapp })} defaultValue={settings.whatsapp} dir="ltr" inputMode="tel" className={adminInput} />
          </AdminField>
          <AdminField id="phone" label="رقم الهاتف المعروض">
            <input {...describe("phone", {})} defaultValue={settings.phone} dir="ltr" className={adminInput} />
          </AdminField>
          <AdminField id="email" label="البريد الإلكتروني">
            <input {...describe("email", {})} type="email" defaultValue={settings.email} dir="ltr" className={adminInput} />
          </AdminField>
          <AdminField id="instagram" label="رابط إنستغرام">
            <input {...describe("instagram", {})} defaultValue={settings.instagram} dir="ltr" className={adminInput} />
          </AdminField>
          <AdminField id="facebook" label="رابط فيسبوك" hint="اتركه فارغًا لإخفائه">
            <input {...describe("facebook", { hint: true })} defaultValue={settings.facebook} dir="ltr" className={adminInput} />
          </AdminField>
        </div>
      </Card>

      <Card title="السياسات">
        <div className="grid gap-5">
          <AdminField id="policyDelivery" label="سياسة التوصيل" hint="كل سطر يظهر كفقرة">
            <textarea {...describe("policyDelivery", { hint: true })} defaultValue={settings.policyDelivery} rows={6} className={adminInput} />
          </AdminField>
          <AdminField id="policyReturns" label="سياسة الاستبدال والإرجاع" hint="إن تركتها فارغة تظهر رسالة «قيد التحديث»">
            <textarea {...describe("policyReturns", { hint: true })} defaultValue={settings.policyReturns} rows={6} className={adminInput} />
          </AdminField>
        </div>
      </Card>

      <Card title="الأسئلة الشائعة العامة">
        <AdminField id="faq" label="الأسئلة والأجوبة" hint="السؤال في سطر والجواب تحته. افصل بين الأسئلة بسطر فارغ.">
          <textarea {...describe("faq", { hint: true })} defaultValue={formatFaq(settings.faq)} rows={12} className={adminInput} />
        </AdminField>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-mist/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <SubmitButton pending={pending}>حفظ الإعدادات</SubmitButton>
        <div className="flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
      <h2 className="mb-5 font-sans text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
