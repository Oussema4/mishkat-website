"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/form-bits";
import { refreshFromMaystro, sendToMaystro, type FormState } from "../../../actions";

type Props = {
  orderId: number;
  enabled: boolean;
  state: "none" | "sent" | "failed";
  tracking: string | null;
  statusLabel: string;
  error: string | null;
  syncedAt: string | null;
};

/** Delivery through Maystro: what was sent, the tracking number and status, and the actions. */
export function MaystroPanel({ orderId, enabled, state, tracking, statusLabel, error, syncedAt }: Props) {
  const [sendState, send] = useActionState<FormState, FormData>(sendToMaystro, {});
  const [syncState, sync] = useActionState<FormState, FormData>(refreshFromMaystro, {});

  if (!enabled) {
    return <p className="mt-3 text-sm text-muted">Maystro غير مربوط بعد (ينقص MAYSTRO_TOKEN في Vercel).</p>;
  }

  if (state === "sent") {
    return (
      <div className="mt-4 space-y-3">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-sm text-muted">رقم التتبّع</dt>
            <dd dir="ltr" className="text-end text-lg font-semibold tabular">
              {tracking ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">الحالة عند Maystro</dt>
            <dd className="font-semibold">{statusLabel}</dd>
          </div>
        </dl>
        {syncedAt ? <p className="text-sm text-muted">آخر تحديث: {syncedAt}</p> : null}
        <form action={sync} className="space-y-2">
          <input type="hidden" name="orderId" value={orderId} />
          <SubmitButton className="w-full">تحديث الحالة من Maystro</SubmitButton>
          <FormMessage state={syncState} />
        </form>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {state === "failed" && error ? (
        <p role="alert" className="rounded-[var(--radius-md)] bg-danger-bg p-3 text-sm leading-6 text-danger">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted">لم يُرسل بعد. يُرسل تلقائيًا عند تأكيد الطلب.</p>
      )}
      <form action={send} className="space-y-2">
        <input type="hidden" name="orderId" value={orderId} />
        <SubmitButton className="w-full">{state === "failed" ? "إعادة الإرسال إلى Maystro" : "إرسال إلى Maystro الآن"}</SubmitButton>
        <FormMessage state={sendState} />
      </form>
    </div>
  );
}
