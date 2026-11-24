"use client";

import { Ban, CalendarClock, CircleAlert, CircleCheck, LoaderCircle, MapPin, Motorbike, Phone, PhoneOff } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { cn } from "@/lib/site";
import { markOrder, type MarkState } from "./actions";

export type DriverOrder = {
  id: number;
  reference: string;
  name: string;
  phone: string;
  phoneLabel: string;
  place: string;
  mapsQuery: string;
  items: string;
  total: string;
  note: string;
  noAnswer: string | null;
  /** "On the way since 14:30" once he marked it. */
  onWay: string | null;
  /** Postponed (by the shop or by him): the card shows in yellow. */
  waiting: boolean;
  /** "مؤجّل لـ الخميس 26/11" while postponed. */
  postponed: string | null;
  postponedUntil: string | null;
  whatsapp: string;
};

/** One order with the driver: who, where, how much to collect, and the five marks. */
export function OrderCard({
  order,
  preview = false,
  dayBounds,
}: {
  order: DriverOrder;
  preview?: boolean;
  dayBounds: { min: string; max: string };
}) {
  const [state, action, pending] = useActionState<MarkState, FormData>(markOrder, {});
  // "Postponed" first asks for the day, then "أجّل" saves it.
  const [askDay, setAskDay] = useState(false);
  const [day, setDay] = useState(order.postponedUntil ?? "");
  useEffect(() => {
    if (!pending && !state.error) setAskDay(false);
  }, [pending, state]);
  const button = "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-0.5 text-[0.72rem] leading-tight font-bold disabled:opacity-50";
  return (
    <li
      className={cn(
        "rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-soft)]",
        order.waiting ? "border-2 border-[#e9c642] bg-[#fff5cc]" : "bg-paper",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold">{order.name}</p>
          <p className="text-xs text-muted tabular" dir="ltr">
            {order.reference}
          </p>
        </div>
        <p className="shrink-0 text-end">
          <span className="block text-xs text-muted">يخلّص</span>
          <span className="text-xl font-bold tabular">{order.total}</span>
        </p>
      </div>

      {order.postponed ? (
        <p className="me-2 mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fdd0a8] px-2.5 py-0.5 text-sm font-medium text-[#6b3000]">
          <CalendarClock aria-hidden className="size-3.5" />
          {order.postponed}
        </p>
      ) : null}
      {order.onWay ? (
        <p className="me-2 mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#bfd3f5] px-2.5 py-0.5 text-sm font-medium text-[#173777]">
          <Motorbike aria-hidden className="size-3.5" />
          {order.onWay}
        </p>
      ) : null}
      {order.noAnswer ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fdeb9c] px-2.5 py-0.5 text-sm font-medium text-[#5c4700]">
          <PhoneOff aria-hidden className="size-3.5" />
          {order.noAnswer}
        </p>
      ) : null}

      <p className="mt-3 font-medium">{order.items}</p>
      <p className="mt-1 flex gap-1.5 leading-7">
        <MapPin aria-hidden className="mt-1.5 size-4 shrink-0 text-gold-deep" />
        <span>{order.place}</span>
      </p>
      {order.note ? <p className="mt-2 rounded-[var(--radius-md)] bg-mist p-2.5 text-sm leading-6">{order.note}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`tel:+216${order.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-ink px-3 font-semibold">
          <Phone aria-hidden className="size-4" />
          <span dir="ltr" className="tabular">
            {order.phoneLabel}
          </span>
        </a>
        <a href={order.whatsapp} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[#1f8f4e] px-3 font-semibold text-paper">
          <WhatsAppIcon className="size-4" />
          واتساب
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.mapsQuery)}`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 font-semibold text-ink underline-offset-4 hover:underline"
        >
          <MapPin aria-hidden className="size-4" />
          الخريطة
        </a>
      </div>

      <form
        action={action}
        onSubmit={(e) => {
          if (preview) {
            e.preventDefault();
            window.alert("هذا عرض برك: الفلايس ما يخدموش هوني، ما يتبدّل شي.");
            return;
          }
          const mark = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
          if (mark === "cancelled" && !window.confirm(`تأكّد: الطلب متاع ${order.name} تلغى؟`)) e.preventDefault();
        }}
        className="mt-4 grid grid-cols-5 gap-1"
      >
        <input type="hidden" name="orderId" value={order.id} />
        <button type="submit" name="mark" value="onWay" disabled={pending} className={cn(button, "bg-[#bfd3f5] text-[#173777]")}>
          <Motorbike aria-hidden className="size-5" />
          في الطريق
        </button>
        <button type="submit" name="mark" value="delivered" disabled={pending} className={cn(button, "bg-[#1f8f4e] text-paper")}>
          <CircleCheck aria-hidden className="size-5" />
          وصلت
        </button>
        <button type="submit" name="mark" value="noAnswer" disabled={pending} className={cn(button, "bg-[#fdeb9c] text-[#5c4700]")}>
          <PhoneOff aria-hidden className="size-5" />
          ما يهزش
        </button>
        <button
          type="button"
          aria-expanded={askDay}
          disabled={pending}
          onClick={() => setAskDay((v) => !v)}
          className={cn(button, "bg-[#fdd0a8] text-[#6b3000]", askDay && "ring-2 ring-[#6b3000]")}
        >
          <CalendarClock aria-hidden className="size-5" />
          مؤجّل
        </button>
        <button type="submit" name="mark" value="cancelled" disabled={pending} className={cn(button, "bg-[#f7b1b1] text-[#7a1616]")}>
          <Ban aria-hidden className="size-5" />
          تم الإلغاء
        </button>
        {askDay ? (
          <div className="col-span-5 mt-1 rounded-[var(--radius-md)] border border-[#fdd0a8] bg-[#fff3e6] p-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">مؤجّل لنهار</span>
              <input
                type="date"
                name="until"
                value={day}
                min={dayBounds.min}
                max={dayBounds.max}
                onChange={(e) => setDay(e.target.value)}
                className="block min-h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper px-3"
              />
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                name="mark"
                value="postponed"
                disabled={!day || pending}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-ink px-4 font-bold text-paper disabled:opacity-50"
              >
                أجّل
              </button>
              <button type="button" onClick={() => setAskDay(false)} className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-4 font-medium text-muted">
                إلغاء
              </button>
            </div>
          </div>
        ) : null}
      </form>
      {pending ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          نسجّل…
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-danger">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
