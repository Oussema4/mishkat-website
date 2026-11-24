"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminInput, FormMessage, keepValuesOnSubmit, SubmitButton } from "@/components/admin/form-bits";
import { cn } from "@/lib/site";
import { saveDriver, setDriverActive, type FormState } from "../../actions";

type DriverRow = { id: number; name: string; phone: string; active: boolean; delivered: number; open: number };

/** One delivery person: edit name and phone, or pause/resume them for new orders. */
function DriverItem({ driver }: { driver: DriverRow }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDriver, {});
  return (
    <li className={cn("rounded-[var(--radius-md)] border border-line p-4", !driver.active && "bg-mist")}>
      <form onSubmit={keepValuesOnSubmit(action)} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="id" value={driver.id} />
        <label className="block">
          <span className="mb-1 block text-sm text-muted">الاسم</span>
          <input name="name" defaultValue={driver.name} required maxLength={40} className={adminInput} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">الهاتف (اختياري)</span>
          <input name="phone" defaultValue={driver.phone} inputMode="tel" dir="ltr" maxLength={20} placeholder="92 123 456" className={cn(adminInput, "text-end tabular")} />
        </label>
        <SubmitButton variant="outline" pending={pending}>
          حفظ
        </SubmitButton>
      </form>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted">
          {driver.active ? "يظهر في الطلبات" : "موقوف: ما يظهرش في الطلبات الجديدة"} · وصّل {driver.delivered} · عندو توا {driver.open}
        </p>
        <Link href={`/admin/maystro/drivers/${driver.id}`} className="inline-flex min-h-10 items-center font-medium text-ink underline-offset-4 hover:underline">
          الحسبة والتطبيق
        </Link>
        <form action={setDriverActive}>
          <input type="hidden" name="id" value={driver.id} />
          <input type="hidden" name="active" value={driver.active ? "0" : "1"} />
          <button type="submit" className={cn("min-h-10 font-medium hover:underline", driver.active ? "text-danger" : "text-success")}>
            {driver.active ? "إيقاف" : "إرجاعه"}
          </button>
        </form>
      </div>
      <div className="mt-2">
        <FormMessage state={state} />
      </div>
    </li>
  );
}

function NewDriver() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDriver, {});
  return (
    <form
      action={action}
      key={state.ok ? state.message : "new"}
      className="mt-4 grid items-end gap-3 rounded-[var(--radius-md)] border border-dashed border-line p-4 sm:grid-cols-[1fr_1fr_auto]"
    >
      <label className="block">
        <span className="mb-1 block text-sm text-muted">اسم موزّع جديد</span>
        <input name="name" required maxLength={40} className={adminInput} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">الهاتف (اختياري)</span>
        <input name="phone" inputMode="tel" dir="ltr" maxLength={20} placeholder="92 123 456" className={cn(adminInput, "text-end tabular")} />
      </label>
      <SubmitButton pending={pending}>زيد</SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function DriversManager({ drivers }: { drivers: DriverRow[] }) {
  return (
    <>
      {drivers.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {drivers.map((d) => (
            <DriverItem key={d.id} driver={d} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-muted">ما فماش موزّعين مسجّلين.</p>
      )}
      <NewDriver />
    </>
  );
}
