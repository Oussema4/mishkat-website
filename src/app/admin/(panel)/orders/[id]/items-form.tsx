"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { adminInput, FormMessage } from "@/components/admin/form-bits";
import { formatTNDInput, parseTND } from "@/lib/admin-format";
import { formatTND } from "@/lib/money";
import { updateOrderItems, type FormState } from "../../../actions";

type Item = { id: number; productName: string; quantity: number; lineTotal: number };

/**
 * Change an order's quantities and prices after talking to the customer (e.g. 3 boxes ordered,
 * 5 agreed on the phone for a special price). The order's totals, the stock and the statistics
 * follow; a parcel already sent to Maystro has to be changed there too.
 */
export function ItemsForm({ orderId, items, deliveryFee, sentToMaystro }: { orderId: number; items: Item[]; deliveryFee: number; sentToMaystro: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrderItems, {});
  const [rows, setRows] = useState(() => items.map((i) => ({ id: i.id, name: i.productName, qty: String(i.quantity), total: formatTNDInput(i.lineTotal) })));
  const [fee, setFee] = useState(formatTNDInput(deliveryFee));
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  const subtotal = rows.reduce((n, r) => n + (parseTND(r.total) ?? 0), 0);
  const grand = subtotal + (parseTND(fee) ?? 0);

  if (!open) {
    return (
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-ink px-4 font-medium hover:bg-ink hover:text-paper"
        >
          <Pencil aria-hidden className="size-4" />
          بدّل الكمية والسوم
        </button>
        <FormMessage state={state} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-4 rounded-[var(--radius-md)] border border-line bg-mist/40 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      {rows.map((r, n) => (
        <fieldset key={r.id} className="grid gap-3 sm:grid-cols-[1fr_7rem_9rem] sm:items-end">
          <legend className="sr-only">{r.name}</legend>
          <input type="hidden" name="itemId" value={r.id} />
          <p className="font-medium">{r.name}</p>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">الكمية</span>
            <input
              name="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              required
              value={r.qty}
              onChange={(e) => setRows((all) => all.map((x, k) => (k === n ? { ...x, qty: e.target.value } : x)))}
              className={adminInput}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">السوم الكل (د.ت)</span>
            <input
              name="lineTotal"
              inputMode="decimal"
              required
              value={r.total}
              onChange={(e) => setRows((all) => all.map((x, k) => (k === n ? { ...x, total: e.target.value } : x)))}
              className={adminInput}
            />
          </label>
        </fieldset>
      ))}
      <label className="block max-w-[9rem] text-sm">
        <span className="mb-1 block text-muted">التوصيل (د.ت)</span>
        <input name="deliveryFee" inputMode="decimal" required value={fee} onChange={(e) => setFee(e.target.value)} className={adminInput} />
      </label>
      <p className="text-sm">
        الحريف يخلّص: <b className="tabular">{formatTND(grand)}</b>
      </p>
      {sentToMaystro ? (
        <p className="rounded-[var(--radius-md)] bg-[#fdeb9c] px-3 py-2 text-sm text-[#5c4700]">
          الطرد تبعث لـ Maystro: هذا يبدّل السيت برك، بدّل السوم زادة في Maystro.
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-ink px-5 font-medium text-paper disabled:opacity-50"
        >
          {pending ? "نسجّل…" : "سجّل"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-4 font-medium text-muted hover:bg-mist">
          إلغاء
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
