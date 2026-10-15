"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-bg p-3 text-sm text-danger">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="mb-1.5 block font-medium">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          defaultValue={state.email}
          className="block min-h-12 w-full rounded-[var(--radius-md)] border border-line px-3.5 text-base outline-none focus:border-ink focus:ring-2 focus:ring-gold/40"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block font-medium">
          كلمة السر
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className="block min-h-12 w-full rounded-[var(--radius-md)] border border-line px-3.5 text-base outline-none focus:border-ink focus:ring-2 focus:ring-gold/40"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
        دخول
      </Button>
    </form>
  );
}
