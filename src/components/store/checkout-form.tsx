"use client";

import { CircleAlert, LoaderCircle, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { placeOrder } from "@/app/actions/store";
import { OrderTotals } from "@/components/store/order-summary";
import { resyncCart, useCartSync } from "@/components/store/use-cart-sync";
import { Button, ButtonLink } from "@/components/ui/button";
import { ar, fill } from "@/i18n/ar";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/money";
import { computeTotals } from "@/lib/pricing";
import { cn } from "@/lib/site";
import { GOVERNORATES } from "@/lib/tunisia";
import { checkoutSchema } from "@/lib/validation";

type FieldName = "firstName" | "lastName" | "phone" | "governorate" | "city" | "address" | "note";

const FIELD_ORDER: FieldName[] = ["firstName", "lastName", "phone", "governorate", "city", "address", "note"];
const LABELS: Record<FieldName, string> = {
  firstName: ar.checkout.firstName,
  lastName: ar.checkout.lastName,
  phone: ar.checkout.phone,
  governorate: ar.checkout.governorate,
  city: ar.checkout.city,
  address: ar.checkout.address,
  note: ar.checkout.note,
};

const inputClass =
  "block w-full min-h-12 rounded-[var(--radius-md)] border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors " +
  "focus:border-ink focus:ring-2 focus:ring-gold/40 aria-[invalid=true]:border-danger";

export function CheckoutForm({ deliveryFee, deliveryTime }: { deliveryFee: number; deliveryTime: string }) {
  const hydrated = useCartSync();
  const lines = useCart((s) => s.lines);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<FieldName | "items" | "form", string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const [placedToken, setPlacedToken] = useState<string | null>(null);

  if (placedToken) {
    return (
      <div role="status" className="mt-10 flex flex-col items-start gap-4 rounded-[var(--radius-lg)] bg-success-bg p-8 text-success">
        <LoaderCircle aria-hidden className="size-8 animate-spin" />
        <p className="text-xl font-semibold">تم حفظ طلبك. جارٍ فتح صفحة التأكيد…</p>
        <Link href={`/order/${placedToken}`} className="font-semibold underline underline-offset-4">
          افتح صفحة التأكيد
        </Link>
      </div>
    );
  }

  if (!hydrated) {
    return <div aria-busy="true" className="mt-10 h-96 animate-pulse rounded-[var(--radius-lg)] bg-sand" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-start gap-5 rounded-[var(--radius-lg)] bg-sand p-8 md:p-12">
        <p className="text-xl">{ar.cart.empty}</p>
        <ButtonLink href="/shop">{ar.cart.emptyCta}</ButtonLink>
      </div>
    );
  }

  const totals = computeTotals(lines, deliveryFee);

  const validateField = (name: FieldName, value: string) => {
    const result = checkoutSchema.shape[name].safeParse(value);
    setErrors((prev) => ({ ...prev, [name]: result.success ? undefined : result.error.issues[0]?.message }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return; // guards against a double click before React re-renders
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(FIELD_ORDER.map((f) => [f, String(form.get(f) ?? "")]));
    const cart = useCart.getState();

    const payload = {
      ...values,
      company: String(form.get("company") ?? ""),
      items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      idempotencyKey: cart.ensureCheckoutKey(),
    };

    // Client-side check first for instant feedback; the server validates again.
    const local = checkoutSchema.safeParse(payload);
    if (!local.success) {
      const next: Record<string, string> = {};
      for (const issue of local.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setBanner(null);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setErrors({});
    setBanner(null);
    submitting.current = true;
    startTransition(async () => {
      try {
        const result = await placeOrder(payload);
        if (result.ok) {
          // The cart is cleared by the confirmation page once it renders.
          setPlacedToken(result.token);
          router.replace(`/order/${result.token}`);
          return;
        }
        submitting.current = false;
        if (result.errors) {
          setErrors(result.errors);
          requestAnimationFrame(() => summaryRef.current?.focus());
        }
        if (result.message) {
          setBanner(result.message);
          requestAnimationFrame(() => bannerRef.current?.focus());
        }
        if (result.refreshCart) await resyncCart().catch(() => undefined);
      } catch {
        submitting.current = false;
        setBanner(ar.checkout.networkError);
        requestAnimationFrame(() => bannerRef.current?.focus());
      }
    });
  };

  const errorList = FIELD_ORDER.filter((f) => errors[f]).map((f) => ({ field: f, message: errors[f]! }));
  if (errors.items) errorList.push({ field: "note", message: errors.items });

  const field = (name: FieldName) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby":
      [errors[name] ? `${name}-error` : null, name === "phone" || name === "address" ? `${name}-hint` : null].filter(Boolean).join(" ") ||
      undefined,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (e.target.value || errors[name]) validateField(name, e.target.value);
    },
    className: cn(inputClass, errors[name] ? "border-danger" : "border-line-strong"),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div className="space-y-10">
        {errorList.length > 0 ? (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-bg p-5 outline-none"
          >
            <p className="flex items-center gap-2 font-semibold text-danger">
              <CircleAlert aria-hidden className="size-5" />
              {ar.checkout.errorsTitle}
            </p>
            <ul className="mt-2 list-disc space-y-1 ps-6">
              {errorList.map((e) => (
                <li key={e.field + e.message}>
                  <a href={`#${e.field}`} className="underline underline-offset-4">
                    {e.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {banner ? (
          <div
            ref={bannerRef}
            tabIndex={-1}
            role="alert"
            className="flex gap-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger-bg p-5 text-danger outline-none"
          >
            <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
            <p>{banner}</p>
          </div>
        ) : null}

        <fieldset className="space-y-5">
          <legend className="text-display-md mb-5">{ar.checkout.contactSection}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="firstName" error={errors.firstName}>
              <input {...field("firstName")} type="text" autoComplete="given-name" required maxLength={60} />
            </Field>
            <Field name="lastName" error={errors.lastName}>
              <input {...field("lastName")} type="text" autoComplete="family-name" required maxLength={60} />
            </Field>
          </div>
          <Field name="phone" error={errors.phone} hint={ar.checkout.phoneHint}>
            <input
              {...field("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              dir="ltr"
              placeholder="92 123 456"
              required
              maxLength={20}
              className={cn(field("phone").className, "text-end tabular")}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-display-md mb-5">{ar.checkout.addressSection}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="governorate" error={errors.governorate}>
              <select {...field("governorate")} autoComplete="address-level1" required defaultValue="">
                <option value="" disabled>
                  {ar.checkout.chooseGovernorate}
                </option>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="city" error={errors.city}>
              <input {...field("city")} type="text" autoComplete="address-level2" required maxLength={80} />
            </Field>
          </div>
          <Field name="address" error={errors.address} hint={ar.checkout.addressHint}>
            <textarea {...field("address")} autoComplete="street-address" required rows={3} maxLength={300} className={cn(field("address").className, "resize-y")} />
          </Field>
          <Field name="note" error={errors.note} optional>
            <textarea {...field("note")} rows={2} maxLength={500} className={cn(field("note").className, "resize-y")} />
          </Field>
          {/* Honeypot for bots — hidden from people and assistive tech */}
          <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>
        </fieldset>

        <section aria-labelledby="payment-title" className="rounded-[var(--radius-lg)] border border-zaytun/25 bg-zaytun-tint p-5">
          <h2 id="payment-title" className="text-eyebrow text-zaytun">
            {ar.checkout.paymentTitle}
          </h2>
          <p className="mt-2 flex items-center gap-3 text-lg font-bold">
            <Wallet aria-hidden className="size-6 text-zaytun" strokeWidth={1.5} />
            {ar.checkout.paymentCod}
          </p>
          <p className="mt-1 text-muted">{ar.checkout.paymentCodBody}</p>
        </section>
      </div>

      <aside aria-label={ar.checkout.summary} className="rounded-[var(--radius-lg)] border border-line bg-sand p-6 lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <h2 className="text-title">{ar.checkout.summary}</h2>
          <Link href="/cart" className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">
            {ar.checkout.edit}
          </Link>
        </div>
        <ul className="mt-4 space-y-4 border-b border-line pb-5">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3">
              <div className="niche-sm relative h-16 w-13 shrink-0 overflow-hidden bg-surface">
                {l.image ? <Image src={l.image} alt="" fill sizes="52px" className="object-cover" /> : null}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm text-muted tabular">
                  {fill("{q} × {p}", { q: l.quantity, p: formatTND(l.unitPrice) })}
                </p>
              </div>
              <p className="font-semibold tabular">{formatTND(l.unitPrice * l.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <OrderTotals {...totals} />
        </div>
        <p className="mt-4 text-sm text-muted">{fill("التوصيل خلال {time} تقريبًا لكل الولايات.", { time: deliveryTime })}</p>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending} aria-disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle aria-hidden className="size-5 animate-spin" />
              {ar.checkout.sending}
            </>
          ) : (
            <>
              {ar.checkout.confirm} · <span className="tabular">{formatTND(totals.total)}</span>
            </>
          )}
        </Button>
        <p className="sr-only" aria-live="polite">
          {pending ? ar.checkout.sending : ""}
        </p>
      </aside>
    </form>
  );
}

function Field({
  name,
  error,
  hint,
  optional,
  children,
}: {
  name: FieldName;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 flex items-baseline gap-1 font-medium">
        {LABELS[name]}
        {optional ? null : (
          <>
            <span aria-hidden className="text-danger">
              *
            </span>
            <span className="sr-only">({ar.checkout.required})</span>
          </>
        )}
      </label>
      {children}
      {hint ? (
        <p id={`${name}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
