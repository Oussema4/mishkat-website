"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/** Loads the saved cart from localStorage once the page is interactive, and keeps tabs in sync. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mishkat-cart") void useCart.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
