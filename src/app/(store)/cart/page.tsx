import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { ar } from "@/i18n/ar";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: ar.cart.title, robots: { index: false } };

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="text-display-lg">{ar.cart.title}</h1>
      <CartView deliveryFee={settings.deliveryFee} />
    </div>
  );
}
