"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_QTY_PER_ITEM } from "./validation";

/** A cart line keeps a display snapshot; prices are always re-checked by the server at checkout. */
export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  image: string;
  unitPrice: number; // millimes
  quantity: number;
  maxQuantity: number;
};

type CartState = {
  lines: CartLine[];
  /** One key per checkout attempt so a double submit can never create two orders. */
  checkoutKey: string | null;
  hydrated: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  syncProducts: (fresh: { productId: number; unitPrice: number; maxQuantity: number; name: string }[]) => void;
  ensureCheckoutKey: () => string;
};

const clampQty = (q: number, max: number) => Math.max(1, Math.min(q, Math.min(max, MAX_QTY_PER_ITEM)));

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      checkoutKey: null,
      hydrated: false,
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          const lines = existing
            ? s.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, ...line, quantity: clampQty(l.quantity + quantity, line.maxQuantity) }
                  : l,
              )
            : [...s.lines, { ...line, quantity: clampQty(quantity, line.maxQuantity) }];
          return { lines, checkoutKey: null };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity: clampQty(quantity, l.maxQuantity) } : l)),
          checkoutKey: null,
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId), checkoutKey: null })),
      clear: () => set({ lines: [], checkoutKey: null }),
      syncProducts: (fresh) =>
        set((s) => ({
          lines: s.lines
            .map((l) => {
              const f = fresh.find((x) => x.productId === l.productId);
              if (!f || f.maxQuantity <= 0) return null;
              return { ...l, name: f.name, unitPrice: f.unitPrice, maxQuantity: f.maxQuantity, quantity: clampQty(l.quantity, f.maxQuantity) };
            })
            .filter((l): l is CartLine => l !== null),
        })),
      ensureCheckoutKey: () => {
        const current = get().checkoutKey;
        if (current) return current;
        const key = newKey();
        set({ checkoutKey: key });
        return key;
      },
    }),
    {
      name: "mishkat-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, checkoutKey: s.checkoutKey }),
      // Rehydrated after mount (see CartHydrator) so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCart.setState({ hydrated: true });
      },
    },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.quantity, 0);
}
