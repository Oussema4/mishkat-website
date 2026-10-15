export type PricedLine = { unitPrice: number; quantity: number };

export function lineTotal(line: PricedLine): number {
  return line.unitPrice * line.quantity;
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
