"use client";

import { CircleAlert, LoaderCircle, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { placeOrder, saveCheckoutLead } from "@/app/actions/store";
import { PixelEvent } from "@/components/store/meta-pixel";
import { LinePrice, OrderTotals } from "@/components/store/order-summary";
import { pixelValue, trackPixel } from "@/lib/meta-pixel";
import { resyncCart, useCartSync } from "@/components/store/use-cart-sync";
import { Button, ButtonLink } from "@/components/ui/button";
import { fill, type Dictionary } from "@/i18n/ar";
import { useI18n } from "@/i18n/client";
import { useCart, type CartLine } from "@/lib/cart-store";
import { formatTND } from "@/lib/money";
import { computeTotals } from "@/lib/pricing";
import { cn } from "@/lib/site";
import { MAYSTRO_WILAYAS } from "@/lib/maystro";
import { GOVERNORATES, normalizeTunisianPhone } from "@/lib/tunisia";
import { checkoutSchemaFor, splitFullName } from "@/lib/validation";

type FieldName = "fullName" | "phone" | "governorate" | "address" | "note";

const FIELD_ORDER: FieldName[] = ["fullName", "phone", "governorate", "address", "note"];
const labels = (t: Dictionary): Record<FieldName, string> => ({
  fullName: t.checkout.fullName,
  phone: t.checkout.phone,
  governorate: t.checkout.governorate,
  address: t.checkout.address,
  note: t.checkout.note,
});

/** Server and schema errors use firstName/lastName; the form shows them on its one name field. */
function toFormErrors(errors: Record<string, string>) {
  const out: Partial<Record<FieldName | "items" | "form", string>> = {};
  for (const [key, message] of Object.entries(errors)) {
    const field = key === "firstName" || key === "lastName" ? "fullName" : (key as FieldName | "items" | "form");
    if (!out[field]) out[field] = message;
  }
  return out;
}

const randomKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

const inputClass =
  "block w-full min-h-12 rounded-[var(--radius-md)] border bg-ink-soft px-3.5 py-2.5 text-base text-paper outline-none placeholder:text-paper/45 transition-colors " +
  "focus:border-gold focus:ring-2 focus:ring-gold/40 aria-[invalid=true]:border-danger";

export type DeliveryInfo = { deliveryFee: number; deliveryTime: string };

/**
 * The order form. On /checkout it orders the cart; with `inline` it orders the lines given (the
 * product page's chosen offer) right where the customer is, without the cart or a second page.
 */
export function CheckoutForm({ deliveryFee, deliveryTime, inline }: DeliveryInfo & { inline?: { lines: CartLine[] } }) {
  const { t, locale, href } = useI18n();
  const checkoutSchema = useMemo(() => checkoutSchemaFor(t.validation), [t]);
  const [governorate, setGovernorate] = useState("");
  const hydrated = useCartSync();
  const cartLines = useCart((s) => s.lines);
  const lines = inline ? inline.lines : cartLines;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<FieldName | "items" | "form", string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const [placedToken, setPlacedToken] = useState<string | null>(null);
  // Inline orders keep their own double-submit key, renewed whenever the chosen items change.
  const inlineKey = useRef<{ items: string; key: string } | null>(null);
  const startedCheckout = useRef(false);

  // Started checkout: once the phone number is valid, what the customer has typed is saved (a
  // second after they stop typing), so the shop can call back if no order follows.
  const formRef = useRef<HTMLFormElement>(null);
  const leadKey = useRef<string | null>(null);
  const leadSent = useRef("");
  const leadTimer = useRef<number | undefined>(undefined);
  const captureLead = () => {
    const form = formRef.current;
    if (!form || submitting.current) return;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "");
    if (!normalizeTunisianPhone(phone)) return;
    leadKey.current ??= randomKey();
    const payload = {
      key: leadKey.current,
      fullName: String(data.get("fullName") ?? ""),
      phone,
      governorate: String(data.get("governorate") ?? ""),
      address: String(data.get("address") ?? ""),
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      locale,
    };
    const signature = JSON.stringify(payload);
    if (signature === leadSent.current) return;
    window.clearTimeout(leadTimer.current);
    leadTimer.current = window.setTimeout(() => {
      leadSent.current = signature;
      saveCheckoutLead(payload).catch(() => undefined);
    }, 1000);
  };
  // A different offer picked after the number was typed: keep the saved checkout up to date.
  const linesSignature = lines.map((l) => `${l.productId}:${l.quantity}`).join(",");
  useEffect(() => {
    if (leadKey.current) captureLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesSignature]);
  useEffect(() => () => window.clearTimeout(leadTimer.current), []);

  if (placedToken) {
    return (
      <div role="status" className={cn("flex flex-col items-start gap-4 rounded-[var(--radius-lg)] bg-success-bg p-8 text-success", inline ? "mt-6" : "mt-10")}>
        <LoaderCircle aria-hidden className="size-8 animate-spin" />
        <p className="text-xl font-semibold">{t.checkout.saved}</p>
        <Link href={href(`/order/${placedToken}`)} className="font-semibold underline underline-offset-4">
          {t.checkout.openConfirmation}
        </Link>
      </div>
    );
  }

  if (!inline && !hydrated) {
    return <div aria-busy="true" className="mt-10 h-96 animate-pulse rounded-[var(--radius-lg)] bg-mist" />;
  }

  if (!inline && lines.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-start gap-5 rounded-[var(--radius-lg)] bg-mist p-8 md:p-12">
        <p className="text-xl">{t.cart.empty}</p>
        <ButtonLink href={href("/shop")}>{t.cart.emptyCta}</ButtonLink>
      </div>
    );
  }

  const totals = computeTotals(lines, deliveryFee);
  const checkoutParams = {
    content_ids: lines.map((l) => String(l.productId)),
    content_type: "product",
    num_items: lines.reduce((n, l) => n + l.quantity, 0),
    value: pixelValue(totals.total),
  };
  // On /checkout, reaching the page starts the checkout; inline, starting to fill the form does.
  const onFormFocus = () => {
    if (!inline || startedCheckout.current) return;
    startedCheckout.current = true;
    trackPixel("InitiateCheckout", checkoutParams);
  };

  const validateField = (name: FieldName, value: string) => {
    const result = name === "fullName" ? checkoutSchema.shape.firstName.safeParse(splitFullName(value).firstName) : checkoutSchema.shape[name].safeParse(value);
    setErrors((prev) => ({ ...prev, [name]: result.success ? undefined : result.error.issues[0]?.message }));
  };

  const idempotencyKey = (items: { productId: number; quantity: number }[]) => {
    if (!inline) return useCart.getState().ensureCheckoutKey();
    const signature = JSON.stringify(items);
    if (inlineKey.current?.items !== signature) {
      const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      inlineKey.current = { items: signature, key };
    }
    return inlineKey.current.key;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return; // guards against a double click before React re-renders
    window.clearTimeout(leadTimer.current);
    const form = new FormData(e.currentTarget);
    const items = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));

    const payload = {
      ...splitFullName(String(form.get("fullName") ?? "")),
      phone: String(form.get("phone") ?? ""),
      governorate: String(form.get("governorate") ?? ""),
      address: String(form.get("address") ?? ""),
      note: String(form.get("note") ?? ""),
      trap: String(form.get("mk_trap") ?? ""),
      items,
      idempotencyKey: idempotencyKey(items),
      ...(leadKey.current ? { leadKey: leadKey.current } : {}),
    };

    // Client-side check first for instant feedback; the server validates again.
    const local = checkoutSchema.safeParse(payload);
    if (!local.success) {
      const next: Record<string, string> = {};
      for (const issue of local.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(toFormErrors(next));
      setBanner(null);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setErrors({});
    setBanner(null);
    submitting.current = true;
    startTransition(async () => {
      try {
        const result = await placeOrder(payload, locale);
        if (result.ok) {
          // The cart is cleared by the confirmation page once it renders.
          setPlacedToken(result.token);
          router.replace(href(`/order/${result.token}`));
          return;
        }
        submitting.current = false;
        if (result.errors) {
          setErrors(toFormErrors(result.errors));
          requestAnimationFrame(() => summaryRef.current?.focus());
        }
        if (result.message) {
          setBanner(result.message);
          requestAnimationFrame(() => bannerRef.current?.focus());
        }
        if (result.newKey) {
          if (inline) inlineKey.current = null;
          else useCart.setState({ checkoutKey: null });
        }
        if (result.refreshCart) {
          if (inline) router.refresh();
          else await resyncCart(locale).catch(() => undefined);
        }
      } catch (err) {
        submitting.current = false;
        // The site was updated while this page was open: its order button points at the old
        // version. Reload (the cart is kept in the browser) so the next press works.
        if (/Server Action|UnrecognizedAction|failed-to-find-server-action/i.test(String(err))) {
          window.location.reload();
          return;
        }
        setBanner(t.checkout.networkError);
        requestAnimationFrame(() => bannerRef.current?.focus());
      }
    });
  };

  const submitLabel = pending ? (
    <>
      <LoaderCircle aria-hidden className="size-5 animate-spin" />
      {t.checkout.sending}
    </>
  ) : (
    <>
      {t.checkout.confirm} · <span className="tabular">{formatTND(totals.total, locale)}</span>
    </>
  );

  const errorList = FIELD_ORDER.filter((f) => errors[f]).map((f) => ({ field: f, message: errors[f]! }));
  if (errors.items) errorList.push({ field: inline ? "fullName" : "note", message: errors.items });

  const field = (name: FieldName) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby":
      [errors[name] ? `${name}-error` : null, name === "phone" ? `${name}-hint` : null].filter(Boolean).join(" ") ||
      undefined,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (e.target.value || errors[name]) validateField(name, e.target.value);
    },
    className: cn(inputClass, errors[name] ? "border-danger" : "border-line"),
  });

  const alerts = (
    <>
      {errorList.length > 0 ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-bg p-5 outline-none">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <CircleAlert aria-hidden className="size-5" />
            {t.checkout.errorsTitle}
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
        <div ref={bannerRef} tabIndex={-1} role="alert" className="flex gap-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger-bg p-5 text-danger outline-none">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          <p>{banner}</p>
        </div>
      ) : null}
    </>
  );

  const nameField = (
    <Field name="fullName" error={errors.fullName}>
      <input {...field("fullName")} type="text" autoComplete="name" required maxLength={120} />
    </Field>
  );

  const phoneField = (
    <Field name="phone" error={errors.phone} hint={t.checkout.phoneHint}>
      <input
        {...field("phone")}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        dir="ltr"
        placeholder="92 123 456"
        required
        maxLength={20}
        className={cn(field("phone").className, "tabular rtl:text-end")}
      />
    </Field>
  );

  const placeFields = (
    <>
      <Field name="governorate" error={errors.governorate}>
        <select {...field("governorate")} autoComplete="address-level1" required value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
          <option value="" disabled>
            {t.checkout.chooseGovernorate}
          </option>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>
              {locale === "ar" ? g : MAYSTRO_WILAYAS[g].name}
            </option>
          ))}
        </select>
      </Field>
      {/* One line the phone's autofill can fill with the customer's saved address. */}
      <Field name="address" error={errors.address}>
        <input {...field("address")} type="text" autoComplete="street-address" placeholder={t.checkout.addressPlaceholder} required minLength={5} maxLength={300} />
      </Field>
    </>
  );

  /*
    Honeypot for bots, hidden from people and assistive tech. Its name and label must mean
    nothing to browser autofill: a field called "company" got filled by Chrome/Safari
    address autofill, and real customers were refused as bots.
  */
  const honeypot = (
    <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="mk_trap">Leave this field empty</label>
      <input id="mk_trap" name="mk_trap" type="text" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" />
    </div>
  );

  if (inline) {
    // Product page: the form follows the offer the customer picked, totals (with delivery) before the button.
    return (
      <form id="order-form" ref={formRef} onSubmit={onSubmit} onFocus={onFormFocus} onChange={captureLead} noValidate className="relative scroll-mt-24 space-y-5">
        {alerts}
        <div className="grid gap-5 sm:grid-cols-2">
          {nameField}
          {phoneField}
        </div>
        {placeFields}
        {honeypot}
        <div className="rounded-[var(--radius-md)] bg-mist p-5">
          <OrderTotals {...totals} locale={locale} />
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Wallet aria-hidden className="size-4 shrink-0 text-gold-deep" strokeWidth={1.5} />
            {t.checkout.paymentCod} · {fill(t.checkout.deliveryNote, { time: deliveryTime })}
          </p>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending} aria-disabled={pending}>
          {submitLabel}
        </Button>
        <p className="sr-only" aria-live="polite">
          {pending ? t.checkout.sending : ""}
        </p>
      </form>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={captureLead} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <PixelEvent event="InitiateCheckout" params={checkoutParams} />
      <div className="space-y-10">
        {alerts}

        <fieldset className="space-y-5">
          <legend className="mb-5 font-display text-2xl font-bold">{t.checkout.contactSection}</legend>
          {nameField}
          {phoneField}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-5 font-display text-2xl font-bold">{t.checkout.addressSection}</legend>
          {placeFields}
          <Field name="note" error={errors.note} optional>
            <textarea {...field("note")} rows={2} maxLength={500} className={cn(field("note").className, "resize-y")} />
          </Field>
          {honeypot}
        </fieldset>

        <section aria-labelledby="payment-title" className="rounded-2xl border border-gold/40 bg-ink-soft p-5">
          <h2 id="payment-title" className="font-sans text-base font-semibold text-muted">
            {t.checkout.paymentTitle}
          </h2>
          <p className="mt-2 flex items-center gap-3 text-lg font-bold">
            <Wallet aria-hidden className="size-6 text-gold-deep" strokeWidth={1.5} />
            {t.checkout.paymentCod}
          </p>
          <p className="mt-1 text-muted">{t.checkout.paymentCodBody}</p>
        </section>
      </div>

      <aside aria-label={t.checkout.summary} className="rounded-[var(--radius-lg)] bg-mist p-6 lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-lg font-bold">{t.checkout.summary}</h2>
          <Link href={href("/cart")} className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">
            {t.checkout.edit}
          </Link>
        </div>
        <ul className="mt-4 space-y-4 border-b border-line pb-5">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3">
              <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-ink-soft">
                {l.image ? <Image src={l.image} alt="" fill sizes="52px" className="object-cover" /> : null}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm text-muted tabular">{fill("{q} × {p}", { q: l.quantity, p: formatTND(l.unitPrice, locale) })}</p>
              </div>
              <LinePrice line={l} className="font-semibold" locale={locale} />
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <OrderTotals {...totals} locale={locale} />
        </div>
        <p className="mt-4 text-sm text-muted">{fill(t.checkout.deliveryNote, { time: deliveryTime })}</p>
        {/* On phones the button lives in the bar fixed at the bottom of the screen (below) */}
        <div className="hidden lg:block">
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending} aria-disabled={pending}>
            {submitLabel}
          </Button>
        </div>
        <p className="sr-only" aria-live="polite">
          {pending ? t.checkout.sending : ""}
        </p>
      </aside>

      {/* Phones: the order button stays on screen while the customer fills the form */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-paper/10 bg-ink/95 px-4 pt-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Button type="submit" size="lg" className="w-full" disabled={pending} aria-disabled={pending}>
          {submitLabel}
        </Button>
      </div>
      {/* Room under the page so the bar never hides the end of it */}
      <div aria-hidden className="h-20 lg:hidden" />
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
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 flex items-baseline gap-1 font-medium">
        {labels(t)[name]}
        {optional ? null : (
          <>
            <span aria-hidden className="text-danger">
              *
            </span>
            <span className="sr-only">({t.checkout.required})</span>
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
