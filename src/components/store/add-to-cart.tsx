"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ar, fill } from "@/i18n/ar";
import { useCart } from "@/lib/cart-store";
import { MAX_QTY_PER_ITEM } from "@/lib/validation";
import { cn } from "@/lib/site";

export type CartProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: string;
};

function toLine(p: CartProduct) {
  return { productId: p.id, slug: p.slug, name: p.name, unitPrice: p.price, image: p.image, maxQuantity: p.stock };
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

/** Quantity + "add to cart" + "order now" block for the product page. */
export function ProductPurchase({ product, sticky = false }: { product: CartProduct; sticky?: boolean }) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const router = useRouter();
  const out = product.stock <= 0;

  const addToCart = (goToCheckout: boolean) => {
    add(toLine(product), qty);
    if (goToCheckout) router.push("/checkout");
    else toast.success(fill("أُضيفت «{name}» إلى السلة", { name: product.name }), { href: "/cart", label: "عرض السلة" });
  };

  if (sticky) {
    return (
      <Button type="button" variant="primary" disabled={out} onClick={() => addToCart(true)} className="flex-1">
        {out ? ar.shop.outOfStock : ar.product.orderNow}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span id="qty-label" className="font-medium">
          {ar.product.quantity}
        </span>
        <QuantityStepper value={qty} max={product.stock} onChange={setQty} label={ar.product.quantity} />
      </div>
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
