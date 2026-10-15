"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { QuantityStepper } from "@/components/store/add-to-cart";
import { OrderTotals } from "@/components/store/order-summary";
import { useCartSync } from "@/components/store/use-cart-sync";
import { ButtonLink } from "@/components/ui/button";
import { ar, fill } from "@/i18n/ar";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/money";
import { computeTotals } from "@/lib/pricing";

export function CartView({ deliveryFee }: { deliveryFee: number }) {
  const hydrated = useCartSync();
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  if (!hydrated) {
    return (
      <div aria-busy="true" className="mt-10 space-y-4">
        <span className="sr-only">{ar.cart.loading}</span>
        <div className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-sand" />
        <div className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-sand" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-start gap-5 rounded-[var(--radius-lg)] bg-sand p-8 md:p-12">
        <ShoppingBag aria-hidden className="size-10 text-gold-deep" strokeWidth={1.5} />
        <p className="text-xl">{ar.cart.empty}</p>
        <ButtonLink href="/shop">{ar.cart.emptyCta}</ButtonLink>
      </div>
    );
  }

  const totals = computeTotals(lines, deliveryFee);

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <li key={line.productId} className="grid grid-cols-[5.5rem_1fr] gap-4 py-6 sm:grid-cols-[7rem_1fr]">
            <Link href={`/products/${line.slug}`} tabIndex={-1} aria-hidden className="niche-sm relative block aspect-[4/5] overflow-hidden bg-sand">
              {line.image ? <Image src={line.image} alt="" fill sizes="112px" className="object-cover" /> : null}
            </Link>
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/products/${line.slug}`} className="text-title decoration-gold decoration-2 underline-offset-8 hover:underline">
                    {line.name}
                  </Link>
                  <p className="text-sm text-muted tabular">
                    {ar.cart.unitPrice}: {formatTND(line.unitPrice)}
                  </p>
                </div>
                <p className="font-bold tabular">{formatTND(line.unitPrice * line.quantity)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper
                  size="sm"
                  value={line.quantity}
                  max={line.maxQuantity}
                  onChange={(n) => setQuantity(line.productId, n)}
                  label={fill("كمية {name}", { name: line.name })}
                />
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-danger hover:bg-danger-bg"
                  aria-label={fill(ar.cart.removeItem, { name: line.name })}
                >
                  <Trash2 aria-hidden className="size-4" />
                  {ar.cart.remove}
                </button>
              </div>
              {line.quantity >= line.maxQuantity ? <p className="text-sm text-warning">{ar.cart.maxReached}</p> : null}
            </div>
          </li>
        ))}
      </ul>

      <aside aria-label={ar.checkout.summary} className="rounded-[var(--radius-lg)] border border-line bg-sand p-6 lg:sticky lg:top-24">
        <OrderTotals {...totals} />
        <p className="mt-4 text-sm text-muted">{ar.checkout.paymentCodBody}</p>
        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          {ar.cart.checkout}
        </ButtonLink>
        <Link href="/shop" className="mt-3 flex min-h-11 items-center justify-center font-medium text-muted hover:text-ink">
          {ar.cart.continue}
        </Link>
      </aside>
    </div>
  );
}
