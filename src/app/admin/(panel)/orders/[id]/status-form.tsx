"use client";

import { CalendarClock, Check, ChevronDown, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { adminInput, FormMessage } from "@/components/admin/form-bits";
import { StatusBadge } from "@/components/admin/status-badge";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { dayLabel } from "@/lib/postpone";
import { cn } from "@/lib/site";
import { updateOrderStatus, type FormState } from "../../../actions";

/**
 * Order status as a list of coloured labels. Picking one saves it at once (cancelling asks first,
 * since it returns items to stock; postponing asks for the day). Keyboard: arrows to move, Enter
 * to pick, Escape to close.
 */
export function StatusForm({
  orderId,
  current,
  postponedUntil,
  dayBounds,
}: {
  orderId: number;
  current: OrderStatus;
  postponedUntil: string | null;
  /** The date picker's range (today … three months), from the server's Tunis day. */
  dayBounds: { min: string; max: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateOrderStatus, {});
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<OrderStatus>(current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Postponing: the day picker is open (before saving, or to change the day).
  const [askDay, setAskDay] = useState(false);
  const [day, setDay] = useState(postponedUntil ?? "");
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  // Follow the saved status, and go back to it when a change is refused.
  useEffect(() => setValue(current), [current, state]);
  useEffect(() => {
    if (state.ok) setAskDay(false);
  }, [state]);

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openList = () => {
    setActive(ORDER_STATUSES.indexOf(value));
    setOpen(true);
  };

  const choose = (next: OrderStatus) => {
    setOpen(false);
    button.current?.focus();
    if (next === "postponed") {
      setAskDay(true);
      return;
    }
    setAskDay(false);
    if (next === current) return;
    if (next === "cancelled" && !confirm("إلغاء الطلب سيعيد المنتجات إلى المخزون. هل تريد المتابعة؟")) return;
    setValue(next);
    const fd = new FormData();
    fd.set("orderId", String(orderId));
    fd.set("status", next);
    startTransition(() => action(fd));
  };

  const postpone = () => {
    if (!day) return;
    setValue("postponed");
    const fd = new FormData();
    fd.set("orderId", String(orderId));
    fd.set("status", "postponed");
    fd.set("until", day);
    startTransition(() => action(fd));
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = ORDER_STATUSES.length - 1;
    if (e.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(ORDER_STATUSES[active]);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className="mt-4 space-y-3">
      <div className="relative">
        <button
          ref={button}
          type="button"
          aria-label="حالة الطلب"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={pending}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              openList();
            }
          }}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-paper px-3 transition-colors hover:border-ink/40 focus-visible:border-ink disabled:opacity-70"
        >
          <StatusBadge status={value} />
          {pending ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin text-muted" />
          ) : (
            <ChevronDown aria-hidden className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
          )}
        </button>

        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label="حالة الطلب"
          aria-activedescendant={open ? `${listId}-${ORDER_STATUSES[active]}` : undefined}
          tabIndex={-1}
          hidden={!open}
          onKeyDown={onListKey}
          className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper py-1 shadow-[var(--shadow-lift)] outline-none"
        >
          {ORDER_STATUSES.map((s, i) => (
            <li
              key={s}
              id={`${listId}-${s}`}
              role="option"
              aria-selected={s === value}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(s)}
              className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3", i === active && "bg-mist")}
            >
              <StatusBadge status={s} />
              {s === value ? <Check aria-hidden className="size-4" /> : null}
            </li>
          ))}
        </ul>
      </div>
      {current === "postponed" && postponedUntil && !askDay ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <CalendarClock aria-hidden className="size-4 text-[#6b3000]" />
          <span>
            مؤجّل لـ <b>{dayLabel(postponedUntil)}</b>
          </span>
          <button type="button" onClick={() => setAskDay(true)} className="min-h-10 font-medium text-ink underline underline-offset-4">
            بدّل النهار
          </button>
        </p>
      ) : null}
      {askDay ? (
        <div className="rounded-[var(--radius-md)] border border-[#fdd0a8] bg-[#fff3e6] p-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">مؤجّل لنهار</span>
            <input type="date" value={day} min={dayBounds.min} max={dayBounds.max} onChange={(e) => setDay(e.target.value)} className={adminInput} />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={!day || pending}
              onClick={postpone}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-ink px-4 font-medium text-paper disabled:opacity-50"
            >
              أجّل
            </button>
            <button type="button" onClick={() => setAskDay(false)} className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-4 font-medium text-muted hover:bg-mist">
              إلغاء
            </button>
          </div>
        </div>
      ) : null}
      <FormMessage state={state} />
    </div>
  );
}
