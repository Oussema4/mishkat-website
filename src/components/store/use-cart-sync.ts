"use client";

import { useEffect, useRef } from "react";
import { refreshCart } from "@/app/actions/store";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { useCart } from "@/lib/cart-store";

/** After the saved cart loads, refresh its prices/stock from the server once. */
export function useCartSync() {
  const hydrated = useCart((s) => s.hydrated);
  const { locale } = useI18n();
  const done = useRef(false);
  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    const ids = useCart.getState().lines.map((l) => l.productId);
    if (ids.length === 0) return;
    // Names come back in this page's language, so the cart follows a language switch.
    refreshCart(ids, locale)
      .then((fresh) => useCart.getState().syncProducts(fresh))
      .catch(() => {
        /* offline: keep the saved snapshot; the server re-checks everything at checkout */
      });
  }, [hydrated, locale]);
  return hydrated;
}

export async function resyncCart(locale: Locale) {
  const ids = useCart.getState().lines.map((l) => l.productId);
  if (ids.length === 0) return;
  const fresh = await refreshCart(ids, locale);
  useCart.getState().syncProducts(fresh);
}
