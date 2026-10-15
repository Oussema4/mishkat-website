import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { ar } from "@/i18n/ar";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: ar.checkout.title, robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="text-display-lg">{ar.checkout.title}</h1>
      <CheckoutForm deliveryFee={settings.deliveryFee} deliveryTime={settings.deliveryTime} />
    </div>
  );
}
