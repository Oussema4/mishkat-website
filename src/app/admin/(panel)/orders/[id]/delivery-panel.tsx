"use client";

import { Check, Truck } from "lucide-react";
import Image from "next/image";
import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { CARRIERS, carrierById, type Carrier, type CarrierId } from "@/lib/carriers";
import { cn } from "@/lib/site";
import { chooseDelivery, refreshFromMaystro, type FormState } from "../../../actions";

type Props = {
  orderId: number;
  carrier: CarrierId | null;
  /** Status is "confirmed": the only time a parcel may be sent to a carrier's system. */
  confirmed: boolean;
  cancelled: boolean;
  maystro: {
    enabled: boolean;
    state: "none" | "sent" | "failed";
    tracking: string | null;
    statusLabel: string;
    error: string | null;
    syncedAt: string | null;
  };
};

function CarrierMark({ carrier, size = "md" }: { carrier: Carrier; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-9 w-13" : "h-12 w-17";
  return carrier.logo ? (
    <Image
      src={carrier.logo.src}
      alt=""
      width={carrier.logo.width}
      height={carrier.logo.height}
      style={{ backgroundColor: carrier.logo.background }}
      className={cn(box, "shrink-0 rounded-md object-contain p-0.5")}
    />
  ) : (
    <span className={cn(box, "inline-flex shrink-0 items-center justify-center rounded-md bg-mist")}>
      <Truck aria-hidden className="size-5 text-muted" strokeWidth={1.5} />
    </span>
  );
}

/** Delivery for this order: pick a carrier from the list, then send (Maystro) or record it (other). */
export function DeliveryPanel({ orderId, carrier, confirmed, cancelled, maystro }: Props) {
  const [choice, setChoice] = useState<CarrierId | null>(carrier);
  const [state, action] = useActionState<FormState, FormData>(chooseDelivery, {});
  const [syncState, sync] = useActionState<FormState, FormData>(refreshFromMaystro, {});

  // Handed to Maystro: tracking and status only (the parcel exists, the choice can't change here).
  if (maystro.state === "sent") {
    const m = carrierById("maystro")!;
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <CarrierMark carrier={m} size="sm" />
          <span className="font-semibold">أُرسل إلى {m.name}</span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-sm text-muted">رقم التتبّع</dt>
            <dd dir="ltr" className="text-end text-lg font-semibold tabular">
              {maystro.tracking ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">الحالة عند Maystro</dt>
            <dd className="font-semibold">{maystro.statusLabel}</dd>
          </div>
        </dl>
        {maystro.syncedAt ? <p className="text-sm text-muted">آخر تحديث: {maystro.syncedAt}</p> : null}
        <form action={sync} className="space-y-2">
          <input type="hidden" name="orderId" value={orderId} />
          <SubmitButton className="w-full">تحديث الحالة من Maystro</SubmitButton>
          <FormMessage state={syncState} />
        </form>
      </div>
    );
  }

  if (cancelled) return <p className="mt-3 text-sm text-muted">الطلب ملغى: لا توصيل.</p>;

  const selected = carrierById(choice);
  return (
    <form
      action={action}
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        if (selected?.api && !confirm(`سيُنشأ طرد حقيقي عند ${selected.name} لهذا الطلب. متابعة؟`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      {maystro.state === "failed" && maystro.error ? (
        <p role="alert" className="rounded-[var(--radius-md)] bg-danger-bg p-3 text-sm leading-6 text-danger">
          لم يُرسل إلى Maystro: {maystro.error}
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">طريقة التوصيل</legend>
        <div role="radiogroup" className="space-y-2">
          {CARRIERS.map((c) => {
            const notConnected = c.id === "maystro" && !maystro.enabled;
            const notConfirmed = c.api && !confirmed;
            const unavailable = notConnected || notConfirmed;
            return (
              <label
                key={c.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-line p-3 transition-colors",
                  "hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-mist has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold-deep",
                  unavailable && "cursor-not-allowed opacity-50 hover:border-line",
                )}
              >
                <input
                  type="radio"
                  name="carrier"
                  value={c.id}
                  checked={choice === c.id}
                  disabled={unavailable}
                  onChange={() => setChoice(c.id)}
                  className="sr-only"
                />
                <CarrierMark carrier={c} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.name}</span>
                  <span className="block text-sm leading-5 text-muted">{notConnected ? "غير مربوط (ينقص MAYSTRO_TOKEN)." : notConfirmed ? "متاح بعد أن تصبح حالة الطلب «تم تأكيد الطلب»." : c.description}</span>
                </span>
                {choice === c.id ? <Check aria-hidden className="size-5 shrink-0" /> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {carrier === "manual" && choice === "manual" ? (
        <p className="text-sm text-muted">محفوظ: توصيل آخر.</p>
      ) : selected && !(selected.api && !confirmed) ? (
        <SubmitButton className="w-full">{selected.api ? `إرسال إلى ${selected.name}` : "حفظ طريقة التوصيل"}</SubmitButton>
      ) : (
        <Button type="button" disabled className="w-full">
          اختر طريقة التوصيل
        </Button>
      )}
      <FormMessage state={state} />
    </form>
  );
}
