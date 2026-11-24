"use client";

import { LoaderCircle, Search, Undo2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { undoMark } from "./actions";
import { OrderCard, type DriverOrder } from "./order-card";

export type RecentOrder = { id: number; name: string; phone: string; phoneLabel: string; place: string; delivered: boolean; total: string; canUndo: boolean };

/** Lower case, no Arabic diacritics, digits only for phones: "حريف" finds "حَريف", "20 444" finds "20444551". */
const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

/** The driver's orders with a search box (name, phone, place or reference), then what he marked today. */
export function DriverList({ orders, recent, filtered = false }: { orders: DriverOrder[]; recent: RecentOrder[]; filtered?: boolean }) {
  const [query, setQuery] = useState("");
  const q = plain(query.trim());
  const digits = query.replace(/\D/g, "");
  const matches = (text: string, phone: string) => !q || plain(text).includes(q) || (digits.length >= 2 && phone.includes(digits));
  const shown = orders.filter((o) => matches(`${o.name} ${o.place} ${o.reference}`, o.phone));
  const shownRecent = recent.filter((o) => matches(`${o.name} ${o.place}`, o.phone));

  return (
    <>
      {orders.length + recent.length > 0 ? (
        <div className="relative mt-5">
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="لوّج على حريف: اسم، نومرو، بلاصة…"
            aria-label="لوّج على حريف"
            className="block min-h-12 w-full rounded-full border border-line bg-paper ps-11 pe-11 text-base outline-none focus:border-ink focus:ring-2 focus:ring-gold/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="فسّخ البحث"
              className="absolute end-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-mist"
            >
              <X aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-lg)] bg-paper p-6 text-center text-muted">{filtered ? "ما عندك حتى طلب في الأيامات هاذي." : "ما عندك حتى طلب توّا."}</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-lg)] bg-paper p-6 text-center text-muted">ما لقيت حتى حريف بالاسم هذا.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}

      {shownRecent.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-sans text-base font-bold">تم التوصيل</h2>
          <ul className="mt-2 space-y-2">
            {shownRecent.map((o) => (
              <RecentItem key={o.id} order={o} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** A delivered or cancelled order of today, with "I tapped by mistake": takes it back and reloads the page. */
function RecentItem({ order }: { order: RecentOrder }) {
  const [pending, start] = useTransition();
  return (
    <li className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] bg-paper p-3">
      <div className="min-w-0">
        <p className="truncate font-semibold">{order.name}</p>
        <p className="text-sm text-muted">
          <a href={`tel:+216${order.phone}`} dir="ltr" className="font-medium text-ink tabular underline-offset-4 hover:underline">
            {order.phoneLabel}
          </a>
        </p>
        <p className="text-sm leading-6 text-muted">{order.place}</p>
        <p className={order.delivered ? "text-sm font-medium text-success" : "text-sm font-medium text-danger"}>
          {order.delivered ? `وصلت · ${order.total}` : "تم الإلغاء"}
        </p>
      </div>
      {order.canUndo ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const fd = new FormData();
              fd.set("orderId", String(order.id));
              await undoMark(fd);
              window.location.reload();
            })
          }
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border-2 border-ink bg-paper px-3.5 text-sm font-bold text-ink hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Undo2 aria-hidden className="size-4" />}
          غلطت، رجّعها
        </button>
      ) : null}
    </li>
  );
}
