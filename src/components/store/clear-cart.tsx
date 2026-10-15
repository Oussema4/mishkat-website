"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/** Empties the cart once the confirmation page (proof the order was saved) is shown. */
export function ClearCart() {
  useEffect(() => {
    void Promise.resolve(useCart.persist.rehydrate()).then(() => useCart.getState().clear());
  }, []);
  return null;
}
