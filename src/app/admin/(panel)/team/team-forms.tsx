"use client";

import { useActionState } from "react";
import { AdminField, FormMessage, SubmitButton, adminInput, describe } from "@/components/admin/form-bits";
import { changeOwnPassword, createAdmin, type FormState } from "../../actions";

export function NewAdminForm() {
  const [state, action] = useActionState<FormState, FormData>(createAdmin, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
      <h2 className="font-sans text-lg font-bold">إضافة مسؤول</h2>
      <AdminField id="name" label="الاسم" error={e.name}>
        <input {...describe("name", { error: e.name })} required className={adminInput} />
      </AdminField>
      <AdminField id="email" label="البريد الإلكتروني" error={e.email}>
        <input {...describe("email", { error: e.email })} type="email" dir="ltr" required autoComplete="off" className={adminInput} />
      </AdminField>
      <AdminField id="password" label="كلمة سر مؤقتة" hint="10 أحرف على الأقل. أرسلها للشخص بطريقة آمنة." error={e.password}>
        <input {...describe("password", { hint: true, error: e.password })} type="password" dir="ltr" required autoComplete="new-password" className={adminInput} />
      </AdminField>
      <SubmitButton>إنشاء الحساب</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changeOwnPassword, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
      <h2 className="font-sans text-lg font-bold">تغيير كلمة السر</h2>
      <AdminField id="current" label="كلمة السر الحالية" error={e.current}>
        <input {...describe("current", { error: e.current })} type="password" dir="ltr" required autoComplete="current-password" className={adminInput} />
      </AdminField>
      <AdminField id="next" label="كلمة السر الجديدة" hint="10 أحرف على الأقل" error={e.next}>
        <input {...describe("next", { hint: true, error: e.next })} type="password" dir="ltr" required autoComplete="new-password" className={adminInput} />
      </AdminField>
      <SubmitButton variant="outline">تغيير كلمة السر</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
