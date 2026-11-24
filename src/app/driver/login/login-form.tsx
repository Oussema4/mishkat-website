"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { driverLogin, type DriverLoginState } from "../actions";

export function DriverLoginForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<DriverLoginState, FormData>(driverLogin, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-bg p-3 text-sm text-danger">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="code" className="mb-1.5 block font-medium">
          الكود
        </label>
        <input
          id="code"
          name="code"
          required
          defaultValue={code}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          dir="ltr"
          placeholder="K7P2-9XQM"
          maxLength={12}
          className="block min-h-12 w-full rounded-[var(--radius-md)] border border-line px-3.5 text-center font-mono text-xl tracking-widest uppercase outline-none focus:border-ink focus:ring-2 focus:ring-gold/40"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
        دخول
      </Button>
    </form>
  );
}
