"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, adminInput } from "@/components/admin/form-bits";
import { createCategory, type FormState } from "../../../actions";

export function CategoryForm() {
  const [state, action] = useActionState<FormState, FormData>(createCategory, {});
  return (
    <details className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
      <summary className="min-h-11 font-semibold">إضافة تصنيف جديد</summary>
      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <label htmlFor="cat-name" className="mb-1.5 block font-medium">
            اسم التصنيف
          </label>
          <input id="cat-name" name="name" required className={adminInput} />
        </div>
        <SubmitButton variant="outline">إضافة</SubmitButton>
        <div className="basis-full">
          <FormMessage state={state} />
        </div>
      </form>
    </details>
  );
}
