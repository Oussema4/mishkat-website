"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { startTransition, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/site";
import type { FormState } from "@/app/admin/actions";

export const adminInput =
  "block w-full min-h-11 rounded-[var(--radius-md)] border border-line bg-paper px-3 py-2 text-base outline-none transition-colors " +
  "focus:border-ink focus:ring-2 focus:ring-gold/40 aria-[invalid=true]:border-danger";

/**
 * Submits through the action without React's automatic form reset, so typed values
 * survive a validation error. Use with the `pending` flag from useActionState.
 */
export function keepValuesOnSubmit(dispatch: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "danger";
  className?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) ref.current?.focus();
  }, [state]);
  if (!state.error && !state.message) return null;
  const error = Boolean(state.error);
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-md)] p-3 text-sm font-medium outline-none",
        error ? "bg-danger-bg text-danger" : "bg-success-bg text-success",
      )}
    >
      {error ? <CircleAlert aria-hidden className="size-4 shrink-0" /> : <CircleCheck aria-hidden className="size-4 shrink-0" />}
      {state.error ?? state.message}
    </p>
  );
}

export function AdminField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-medium">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria props tying an input to its hint/error. */
export function describe(id: string, opts: { hint?: boolean; error?: string }) {
  const ids = [opts.error ? `${id}-error` : null, opts.hint ? `${id}-hint` : null].filter(Boolean).join(" ");
  return { id, name: id, "aria-invalid": opts.error ? true : undefined, "aria-describedby": ids || undefined };
}
