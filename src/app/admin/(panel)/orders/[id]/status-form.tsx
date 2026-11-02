"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { FormMessage, adminInput } from "@/components/admin/form-bits";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { updateOrderStatus, type FormState } from "../../../actions";

/** Picking a status saves it at once (cancelling asks first, since it returns items to stock). */
export function StatusForm({ orderId, current }: { orderId: number; current: OrderStatus }) {
  const [state, action] = useActionState<FormState, FormData>(updateOrderStatus, {});
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<OrderStatus>(current);

  // Follow the saved status, and go back to it when a change is refused.
  useEffect(() => setValue(current), [current, state]);

  return (
    <div className="mt-4 space-y-3">
      <label htmlFor="status" className="sr-only">
        حالة الطلب
      </label>
      <div className="relative">
        <select
          id="status"
          value={value}
          disabled={pending}
          aria-busy={pending}
          className={adminInput}
          onChange={(e) => {
            const next = e.target.value as OrderStatus;
            if (next === current) return;
            if (next === "cancelled" && !confirm("إلغاء الطلب سيعيد المنتجات إلى المخزون. هل تريد المتابعة؟")) return;
            setValue(next);
            const fd = new FormData();
            fd.set("orderId", String(orderId));
            fd.set("status", next);
            startTransition(() => action(fd));
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ar.status[s]}
            </option>
          ))}
        </select>
        {pending ? <LoaderCircle aria-hidden className="pointer-events-none absolute end-9 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" /> : null}
      </div>
      <FormMessage state={state} />
    </div>
  );
}
