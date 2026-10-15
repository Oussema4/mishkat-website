"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, adminInput } from "@/components/admin/form-bits";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { updateOrderStatus, type FormState } from "../../../actions";

export function StatusForm({ orderId, current }: { orderId: number; current: OrderStatus }) {
  const [state, action] = useActionState<FormState, FormData>(updateOrderStatus, {});
  return (
    <form
      action={action}
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        const next = new FormData(e.currentTarget).get("status");
        if (next === "cancelled" && !confirm("إلغاء الطلب سيعيد المنتجات إلى المخزون. هل تريد المتابعة؟")) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="status" className="sr-only">
        الحالة الجديدة
      </label>
      <select id="status" name="status" defaultValue={current} key={current} className={adminInput}>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ar.status[s]}
          </option>
        ))}
      </select>
      <SubmitButton className="w-full">حفظ الحالة</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
