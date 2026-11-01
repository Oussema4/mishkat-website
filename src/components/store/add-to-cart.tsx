"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ar, boxesLabel, fill } from "@/i18n/ar";
import type { Bundle } from "@/db/schema";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/money";
import { bundleTotal } from "@/lib/pricing";
import { MAX_QTY_PER_ITEM } from "@/lib/validation";
import { cn } from "@/lib/site";

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
        toast.success(fill("أُضيفت «{name}» إلى السلة", { name: product.name }), { href: "/cart", label: "عرض السلة" });
      }}
    >
      <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
      {disabled ? ar.shop.outOfStock : ar.shop.addToCart}
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
  const limit = Math.max(1, Math.min(max, MAX_QTY_PER_ITEM));
  const btn = cn(
    "inline-flex items-center justify-center text-paper transition-colors hover:bg-paper/10 disabled:opacity-35 disabled:hover:bg-transparent",
    size === "sm" ? "size-10" : "size-12",
  );
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-[var(--radius-md)] border border-line bg-ink-soft">
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= limit} aria-label={ar.product.increase}>
        <Plus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className={cn("min-w-10 text-center font-semibold tabular", size === "sm" ? "text-base" : "text-lg")}>
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={ar.product.decrease}>
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

/** Pre-selected quantity: the first offer (2 boxes for Sabili) when there is enough stock. */
function defaultQuantity(p: CartProduct) {
  const first = Math.min(...p.bundles.map((b) => b.quantity));
  return Number.isFinite(first) && first <= p.stock ? first : 1;
}

/** The chosen quantity is shared by the purchase block and the phone's sticky order bar. */
const useChosen = create<{ qty: Record<number, number>; choose: (id: number, n: number) => void }>((set) => ({
  qty: {},
  choose: (id, n) => set((s) => ({ qty: { ...s.qty, [id]: n } })),
}));

function useQuantity(p: CartProduct): [number, (n: number) => void] {
  const qty = useChosen((s) => s.qty[p.id]) ?? defaultQuantity(p);
  const choose = useChosen((s) => s.choose);
  return [qty, (n) => choose(p.id, n)];
}

function OfferPicker({ product, value, onChange }: { product: CartProduct; value: number; onChange: (n: number) => void }) {
  const choices = offerChoices(product);
  return (
    <fieldset>
      <legend className="font-medium">{ar.product.offers}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {choices.map((c) => {
          const saved = c.regular - c.total;
          const unavailable = c.quantity > product.stock;
          return (
            <label
              key={c.quantity}
              className={cn(
                "relative flex cursor-pointer flex-col gap-1 rounded-[var(--radius-md)] border border-line bg-ink-soft p-4 transition-colors",
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
              <span className="font-semibold">{boxesLabel(c.quantity)}</span>
              <span className="text-2xl font-bold tabular">{formatTND(c.total)}</span>
              {saved > 0 ? (
                <>
                  <span className="text-sm text-muted tabular">
                    <span className="line-through">
                      <span className="sr-only">بدلًا من </span>
                      {formatTND(c.regular)}
                    </span>
                    {" · "}
                    {fill(ar.product.offerUnit, { price: formatTND(Math.round(c.total / c.quantity)) })}
                  </span>
                  <span className="mt-1 self-start rounded-full bg-gold px-2.5 py-0.5 text-sm font-semibold text-ink tabular">
                    {fill(ar.product.offerSave, { amount: formatTND(saved) })}
                  </span>
                </>
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
  const choices = offerChoices(product);
  return (
    <fieldset>
      <legend className="sr-only">{ar.product.offers}</legend>
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
              <span className="text-xs text-paper/80">{boxesLabel(c.quantity)}</span>
              <span className="font-bold tabular">{formatTND(c.total)}</span>
              {saved > 0 ? (
                <span className="text-[0.7rem] font-semibold text-gold tabular">{fill(ar.product.offerSave, { amount: formatTND(saved) })}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Quantity (or quantity offers) + "add to cart" + "order now" block for the product page. */
export function ProductPurchase({ product, sticky = false }: { product: CartProduct; sticky?: boolean }) {
  const [qty, setQty] = useQuantity(product);
  const add = useCart((s) => s.add);
  const router = useRouter();
  const out = product.stock <= 0;
  const hasOffers = product.bundles.length > 0;

  const addToCart = (goToCheckout: boolean) => {
    add(toLine(product), qty);
    if (goToCheckout) router.push("/checkout");
    else toast.success(fill("أُضيفت «{name}» إلى السلة", { name: product.name }), { href: "/cart", label: "عرض السلة" });
  };

  if (sticky && hasOffers) {
    // On phones the offers stay in view from the first screen: one box is as visible as the packs.
    return (
      <div className="space-y-2">
        <OfferChips product={product} value={qty} onChange={setQty} />
        <Button type="button" variant="primary" disabled={out} onClick={() => addToCart(true)} className="w-full">
          {out ? (
            ar.shop.outOfStock
          ) : (
            <>
              {ar.product.orderNow} · <span className="tabular">{formatTND(bundleTotal(product.price, qty, product.bundles))}</span>
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
          <span className="font-bold tabular">{formatTND(product.price * qty)}</span>
        </div>
        <Button type="button" variant="primary" disabled={out} onClick={() => addToCart(true)} className="flex-1">
          {out ? ar.shop.outOfStock : ar.product.orderNow}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasOffers ? (
        <OfferPicker product={product} value={qty} onChange={setQty} />
      ) : (
        <div className="flex items-center gap-4">
          <span id="qty-label" className="font-medium">
            {ar.product.quantity}
          </span>
          <QuantityStepper value={qty} max={product.stock} onChange={setQty} label={ar.product.quantity} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="primary" size="lg" disabled={out} onClick={() => addToCart(true)}>
          {out ? ar.shop.outOfStock : ar.product.orderNow}
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={out} onClick={() => addToCart(false)}>
          <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
          {ar.product.addToCart}
        </Button>
      </div>
    </div>
  );
}
