"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { CheckoutForm, type DeliveryInfo } from "@/components/store/checkout-form";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { fill } from "@/i18n/ar";
import { useI18n } from "@/i18n/client";
import type { Bundle } from "@/db/schema";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/money";
import { pixelValue, trackPixel } from "@/lib/meta-pixel";
import { bundleTotal } from "@/lib/pricing";
import { MAX_QTY_PER_ITEM } from "@/lib/validation";
import { cn } from "@/lib/site";
import { whatsappLink } from "@/lib/tunisia";
import { WhatsAppIcon } from "@/components/brand/social-icons";

export type CartProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  bundles: Bundle[];
};

function toLine(p: CartProduct) {
  return { productId: p.id, slug: p.slug, name: p.name, unitPrice: p.price, bundles: p.bundles, image: p.image, maxQuantity: p.stock };
}

/** Compact button for product cards. */
export function AddToCartButton({ product, variant = "outline", className }: { product: CartProduct; variant?: "outline" | "primary" | "sabili"; className?: string }) {
  const { t, href } = useI18n();
  const add = useCart((s) => s.add);
  const disabled = product.stock <= 0;
  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      className={className}
      onClick={() => {
        add(toLine(product), 1);
        trackPixel("AddToCart", { content_ids: [String(product.id)], content_type: "product", content_name: product.name, value: pixelValue(product.price) });
        toast.success(fill(t.shop.added, { name: product.name }), { href: href("/cart"), label: t.shop.viewCart });
      }}
    >
      <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
      {disabled ? t.shop.outOfStock : t.shop.addToCart}
    </Button>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const limit = Math.max(1, Math.min(max, MAX_QTY_PER_ITEM));
  const btn = cn(
    "inline-flex items-center justify-center text-paper transition-colors hover:bg-paper/10 disabled:opacity-35 disabled:hover:bg-transparent",
    size === "sm" ? "size-10" : "size-12",
  );
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-[var(--radius-md)] border border-line bg-ink-soft">
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= limit} aria-label={t.product.increase}>
        <Plus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className={cn("min-w-10 text-center font-semibold tabular", size === "sm" ? "text-base" : "text-lg")}>
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={t.product.decrease}>
        <Minus aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** The choices shown on the product page: one box, then each quantity offer (2 for 100…). */
function offerChoices(p: CartProduct) {
  if (p.bundles.length === 0) return [];
  const quantities = [...new Set([1, ...p.bundles.map((b) => b.quantity)])].sort((a, b) => a - b);
  return quantities.map((quantity) => ({ quantity, total: bundleTotal(p.price, quantity, p.bundles), regular: p.price * quantity }));
}

/** The chosen quantity is shared by the purchase block and the phone's sticky order bar. */
const useChosen = create<{ qty: Record<number, number>; choose: (id: number, n: number) => void }>((set) => ({
  qty: {},
  choose: (id, n) => set((s) => ({ qty: { ...s.qty, [id]: n } })),
}));

function useQuantity(p: CartProduct): [number, (n: number) => void] {
  // One box is pre-selected; the offers stay one tap away.
  const qty = useChosen((s) => s.qty[p.id]) ?? 1;
  const choose = useChosen((s) => s.choose);
  return [qty, (n) => choose(p.id, n)];
}

function OfferPicker({ product, value, onChange }: { product: CartProduct; value: number; onChange: (n: number) => void }) {
  const { t, locale } = useI18n();
  const choices = offerChoices(product);
  // Compact side by side, like the phone's sticky bar, so the order form starts close below.
  return (
    <fieldset>
      <legend className="font-medium">{t.product.offers}</legend>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }}>
        {choices.map((c) => {
          const saved = c.regular - c.total;
          const unavailable = c.quantity > product.stock;
          return (
            <label
              key={c.quantity}
              className={cn(
                "flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-line bg-ink-soft px-1 py-2 text-center leading-tight transition-colors",
                "hover:border-gold/60 has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold",
                unavailable && "cursor-not-allowed opacity-45 hover:border-line",
              )}
            >
              <input
                type="radio"
                name={`offer-${product.id}`}
                value={c.quantity}
                checked={value === c.quantity}
                disabled={unavailable}
                onChange={() => onChange(c.quantity)}
                className="sr-only"
              />
              <span className="text-sm text-paper/80">{t.boxes(c.quantity)}</span>
              <span className="whitespace-nowrap text-lg font-bold tabular">{formatTND(c.total, locale)}</span>
              {saved > 0 ? (
                <span className="text-xs font-semibold text-gold tabular">
                  <span className="sr-only">
                    {t.product.insteadOf} {formatTND(c.regular, locale)} ·{" "}
                  </span>
                  {fill(t.product.offerSave, { amount: formatTND(saved, locale) })}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** The same choices, small enough for the phone's sticky order bar. */
function OfferChips({ product, value, onChange }: { product: CartProduct; value: number; onChange: (n: number) => void }) {
  const { t, locale } = useI18n();
  const choices = offerChoices(product);
  return (
    <fieldset>
      <legend className="sr-only">{t.product.offers}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }}>
        {choices.map((c) => {
          const saved = c.regular - c.total;
          const unavailable = c.quantity > product.stock;
          return (
            <label
              key={c.quantity}
              className={cn(
                "flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-line bg-ink-soft px-1 py-1.5 text-center leading-tight transition-colors",
                "has-[:checked]:border-gold has-[:checked]:bg-gold/15 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold",
                unavailable && "cursor-not-allowed opacity-45",
              )}
            >
              <input
                type="radio"
                name={`offer-bar-${product.id}`}
                value={c.quantity}
                checked={value === c.quantity}
                disabled={unavailable}
                onChange={() => onChange(c.quantity)}
                className="sr-only"
              />
              <span className="text-xs text-paper/80">{t.boxes(c.quantity)}</span>
              <span className="whitespace-nowrap font-bold tabular">{formatTND(c.total, locale)}</span>
              {saved > 0 ? (
                <span className="text-[0.7rem] font-semibold text-gold tabular">{fill(t.product.offerSave, { amount: formatTND(saved, locale) })}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Scrolls to the product page's order form and puts the cursor in its first field. */
function goToOrderForm() {
  const form = document.getElementById("order-form");
  if (!form) return false;
  // The form's block (its heading included) comes into view, then the cursor goes to the name:
  // focusing during the smooth scroll would make the browser jump to the field instead.
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  (form.parentElement ?? form).scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  window.setTimeout(() => form.querySelector<HTMLInputElement>("#fullName")?.focus({ preventScroll: true }), smooth ? 600 : 0);
  return true;
}

/**
 * Phones: the offers and an order button stay at the bottom of the screen. The button takes the
 * customer to the order form on the page; the bar steps aside while that form is on screen.
 */
export function StickyOrderBar({ product, deliveryFee }: { product: CartProduct; deliveryFee: number }) {
  const [formOnScreen, setFormOnScreen] = useState(false);
  useEffect(() => {
    const form = document.getElementById("order-form");
    if (!form) return;
    const observer = new IntersectionObserver(([entry]) => setFormOnScreen(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(form);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 bg-mist px-4 py-3 transition-[translate,opacity] duration-200 md:hidden",
        formOnScreen && "pointer-events-none translate-y-full opacity-0",
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-hidden={formOnScreen || undefined}
      inert={formOnScreen || undefined}
    >
      <ProductPurchase product={product} sticky deliveryFee={deliveryFee} />
    </div>
  );
}

/**
 * Product page purchase block: the quantity offers, then (with `order`) the order form itself,
 * so the customer orders without leaving the page. Without `order`: "order now" + "add to cart".
 */
export function ProductPurchase({
  product,
  sticky = false,
  order,
  deliveryFee,
  whatsapp,
}: {
  product: CartProduct;
  sticky?: boolean;
  order?: DeliveryInfo;
  /** Sticky bar: the delivery fee, shown under the offers. */
  deliveryFee?: number;
  /** The shop's WhatsApp number: a "questions?" link next to the order form. */
  whatsapp?: string;
}) {
  const { t, locale, href } = useI18n();
  const [qty, setQty] = useQuantity(product);
  const add = useCart((s) => s.add);
  const router = useRouter();
  const out = product.stock <= 0;
  const hasOffers = product.bundles.length > 0;

  const addToCart = (goToCheckout: boolean) => {
    add(toLine(product), qty);
    trackPixel("AddToCart", {
      content_ids: [String(product.id)],
      content_type: "product",
      content_name: product.name,
      num_items: qty,
      value: pixelValue(bundleTotal(product.price, qty, product.bundles)),
    });
    if (goToCheckout) router.push(href("/checkout"));
    else toast.success(fill(t.shop.added, { name: product.name }), { href: href("/cart"), label: t.shop.viewCart });
  };

  // The sticky bar's button: to the form on this page when there is one, else to checkout.
  const orderNow = () => {
    if (!goToOrderForm()) addToCart(true);
  };

  if (sticky && hasOffers) {
    // On phones the offers stay in view from the first screen: one box is as visible as the packs.
    return (
      <div className="space-y-2">
        <OfferChips product={product} value={qty} onChange={setQty} />
        {deliveryFee !== undefined ? (
          <p className="text-center text-xs text-muted tabular">{fill(t.product.deliveryExtra, { fee: formatTND(deliveryFee, locale) })}</p>
        ) : null}
        <Button type="button" variant="primary" disabled={out} onClick={orderNow} className="w-full">
          {out ? (
            t.shop.outOfStock
          ) : (
            <>
              {t.product.orderNow} · <span className="tabular">{formatTND(bundleTotal(product.price, qty, product.bundles), locale)}</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  if (sticky) {
    return (
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <span className="block text-sm text-muted">{product.name}</span>
          <span className="font-bold tabular">{formatTND(product.price * qty, locale)}</span>
        </div>
        <Button type="button" variant="primary" disabled={out} onClick={orderNow} className="flex-1">
          {out ? t.shop.outOfStock : t.product.orderNow}
        </Button>
      </div>
    );
  }

  const quantityChoice = hasOffers ? (
    <OfferPicker product={product} value={qty} onChange={setQty} />
  ) : (
    <div className="flex items-center gap-4">
      <span id="qty-label" className="font-medium">
        {t.product.quantity}
      </span>
      <QuantityStepper value={qty} max={product.stock} onChange={setQty} label={t.product.quantity} />
    </div>
  );

  if (order && !out) {
    return (
      <div className="space-y-6">
        {quantityChoice}
        <div className="scroll-mt-20">
          <h2 className="font-sans text-lg font-bold">{t.product.orderForm}</h2>
          {whatsapp ? (
            <a
              href={whatsappLink(whatsapp, fill(t.product.askWhatsappMessage, { name: product.name }))}
              target="_blank"
              rel="noopener"
              className="mt-1 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#3ecf7a] underline-offset-4 hover:underline"
            >
              <WhatsAppIcon className="size-4" />
              {t.product.askWhatsapp}
            </a>
          ) : null}
          <div className="mt-3">
            <CheckoutForm {...order} inline={{ lines: [{ ...toLine(product), quantity: qty }] }} />
          </div>
        </div>
        <Button type="button" variant="outline" disabled={out} onClick={() => addToCart(false)} className="w-full">
          <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
          {t.product.addToCart}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quantityChoice}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="primary" size="lg" disabled={out} onClick={() => addToCart(true)}>
          {out ? t.shop.outOfStock : t.product.orderNow}
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={out} onClick={() => addToCart(false)}>
          <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
          {t.product.addToCart}
        </Button>
      </div>
    </div>
  );
}
