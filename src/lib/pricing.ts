import type { Bundle } from "@/db/schema";

export type PricedLine = { unitPrice: number; quantity: number; bundles?: Bundle[] | null };

/**
 * Price of `quantity` pieces: the cheapest mix of single pieces and quantity offers
 * (with 2 for 100 and 3 for 150: 4 pieces = 2 + 2 = 200, 5 = 3 + 2 = 250).
 */
export function bundleTotal(unitPrice: number, quantity: number, bundles?: Bundle[] | null): number {
  const offers = (bundles ?? []).filter((b) => b.quantity > 1 && b.price > 0);
  if (offers.length === 0 || quantity < 2) return unitPrice * quantity;
  const best = [0];
  for (let q = 1; q <= quantity; q++) {
    let cost = best[q - 1] + unitPrice;
    for (const b of offers) if (b.quantity <= q) cost = Math.min(cost, best[q - b.quantity] + b.price);
    best.push(cost);
  }
  return best[quantity];
}

export function lineTotal(line: PricedLine): number {
  return bundleTotal(line.unitPrice, line.quantity, line.bundles);
}

/** Totals in millimes. Delivery applies once per order when the cart isn't empty. */
export function computeTotals(lines: PricedLine[], deliveryFee: number) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const delivery = lines.length > 0 ? deliveryFee : 0;
  return { subtotal, deliveryFee: delivery, total: subtotal + delivery };
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
