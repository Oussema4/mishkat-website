"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/admin/copy-button";
import { adminInput, FormMessage, keepValuesOnSubmit, SubmitButton } from "@/components/admin/form-bits";
import { cn } from "@/lib/site";
import { addDriverLedger, makeDriverCode, type FormState } from "../../../../actions";

/** Makes (or remakes) the code the driver types once in his app. The code shows only here, once. */
export function DriverCodeForm({ driverId, hasCode, siteUrl }: { driverId: number; hasCode: boolean; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(makeDriverCode, {});
  const link = state.code ? `${siteUrl}/driver/login?code=${state.code}` : "";
  return (
    <div className="mt-3 space-y-3">
      {state.code ? (
        <div className="rounded-[var(--radius-md)] border-2 border-gold bg-gold/10 p-4">
          <p className="text-sm text-muted">ابعثو للموزّع (يكتبو مرّة وحدة في التطبيق). ما يتعاودش يبان، كان ضاع اعمل كود جديد.</p>
          <p className="mt-2 flex items-center gap-2">
            <span dir="ltr" className="font-mono text-3xl font-bold tracking-widest">
              {state.code}
            </span>
            <CopyButton value={state.code} label="انسخ الكود" />
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm">
            <span dir="ltr" className="truncate text-muted">
              {link}
            </span>
            <CopyButton value={link} label="انسخ الرابط" />
          </p>
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          if (hasCode && !window.confirm("الكود القديم يوقف، والموزّع يلزمو يكتب الجديد. نكمّلو؟")) {
            e.preventDefault();
            return;
          }
          keepValuesOnSubmit(action)(e);
        }}
      >
        <input type="hidden" name="id" value={driverId} />
        <SubmitButton variant={hasCode ? "outline" : "primary"} pending={pending}>
          {hasCode ? "اعمل كود جديد" : "اعمل كود الدخول"}
        </SubmitButton>
      </form>
      {state.error ? <FormMessage state={state} /> : null}
    </div>
  );
}

const KINDS = [
  { value: "boxesGiven", label: "عطيتو باكوات", unit: "باكو" },
  { value: "boxesReturned", label: "رجّعلي باكوات", unit: "باكو" },
  { value: "cashReceived", label: "خلّصني فلوس", unit: "د.ت" },
] as const;

/** One line in the account: boxes handed over, boxes back, or cash handed in. */
export function LedgerForm({ driverId }: { driverId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addDriverLedger, {});
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("boxesGiven");
  const unit = KINDS.find((k) => k.value === kind)!.unit;
  const form = useRef<HTMLFormElement>(null);
  // Saved: empty the amount and note for the next line (the kind stays as chosen).
  useEffect(() => {
    if (!state.ok || !form.current) return;
    for (const name of ["amount", "note"]) {
      const input = form.current.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = "";
    }
  }, [state]);
  return (
    <form ref={form} onSubmit={keepValuesOnSubmit(action)} className="mt-3 space-y-3">
      <input type="hidden" name="driverId" value={driverId} />
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <label
            key={k.value}
            className={cn(
              "inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium",
              kind === k.value ? "border-ink bg-ink text-paper" : "border-line hover:bg-mist",
            )}
          >
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
            {k.label}
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">قدّاش ({unit})</span>
          <input name="amount" required inputMode={kind === "cashReceived" ? "decimal" : "numeric"} dir="ltr" className={cn(adminInput, "text-end tabular")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">ملاحظة (اختياري)</span>
          <input name="note" maxLength={200} className={adminInput} />
        </label>
        <SubmitButton pending={pending}>سجّل</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
