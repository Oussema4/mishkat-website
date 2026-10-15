"use client";

import { useEffect, useRef } from "react";
import { refreshCart } from "@/app/actions/store";
import { useCart } from "@/lib/cart-store";

/** After the saved cart loads, refresh its prices/stock from the server once. */
export function useCartSync() {
  const hydrated = useCart((s) => s.hydrated);
  const done = useRef(false);
  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    const ids = useCart.getState().lines.map((l) => l.productId);
    if (ids.length === 0) return;
    refreshCart(ids)
      .then((fresh) => useCart.getState().syncProducts(fresh))
      .catch(() => {
        /* offline: keep the saved snapshot; the server re-checks everything at checkout */
      });
  }, [hydrated]);
  return hydrated;
}

export async function resyncCart() {
  const ids = useCart.getState().lines.map((l) => l.productId);
  if (ids.length === 0) return;
  const fresh = await refreshCart(ids);
  useCart.getState().syncProducts(fresh);
}
