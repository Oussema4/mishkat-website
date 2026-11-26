"use client";

import { Ban, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { FormMessage } from "@/components/admin/form-bits";
import { blockCustomer, unblockCustomer, type FormState } from "../../../actions";

/** Block (or unblock) the connection this order came from, for 30 days. */
export function BlockForm({ orderId, blocked }: { orderId: number; blocked: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(blocked ? unblockCustomer : blockCustomer, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ask = blocked
          ? "تنحّي الحظر على هذا الجهاز؟"
          : "تحظر الجهاز (الكونكسيون) الي جا منو هذا الطلب 30 يوم؟ ما عادش ينجم يطلب من السيت.";
        if (!window.confirm(ask)) e.preventDefault();
      }}
      className="mt-4 space-y-2"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className={
          blocked
            ? "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line px-4 font-medium hover:bg-mist disabled:opacity-50"
            : "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[#b42318] px-4 font-medium text-[#b42318] hover:bg-[#fdeaea] disabled:opacity-50"
        }
      >
        {blocked ? <ShieldCheck aria-hidden className="size-4" /> : <Ban aria-hidden className="size-4" />}
        {blocked ? "نحّي الحظر" : "حظر هذا الجهاز"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
