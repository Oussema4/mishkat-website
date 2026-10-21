"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import Link from "next/link";
import { create } from "zustand";
import { cn } from "@/lib/site";

type Toast = { id: number; kind: "success" | "error"; message: string; action?: { href: string; label: string } };

const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void }>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] });
    setTimeout(() => get().dismiss(id), t.kind === "error" ? 7000 : 4500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message: string, action?: Toast["action"]) => useToasts.getState().push({ kind: "success", message, action }),
  error: (message: string) => useToasts.getState().push({ kind: "error", message }),
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[var(--radius-md)] border bg-paper px-4 py-3 shadow-[var(--shadow-lift)] night:border-paper/12 night:bg-ink-soft night:text-paper",
            "animate-[toast-in_220ms_var(--ease-out-soft)]",
            t.kind === "error" ? "border-danger/30" : "border-line",
          )}
        >
          {t.kind === "error" ? (
            <CircleAlert aria-hidden className="size-5 shrink-0 text-danger" />
          ) : (
            <CircleCheck aria-hidden className="size-5 shrink-0 text-success" />
          )}
          <p className="flex-1 text-[0.95rem]">{t.message}</p>
          {t.action ? (
            <Link href={t.action.href} onClick={() => dismiss(t.id)} className="shrink-0 font-semibold text-ink underline underline-offset-4 night:text-gold-light">
              {t.action.label}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="-me-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-mist"
            aria-label="إغلاق التنبيه"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
