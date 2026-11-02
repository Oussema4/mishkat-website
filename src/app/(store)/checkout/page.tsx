import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { ar } from "@/i18n/ar";
import { getCommunes } from "@/server/maystro";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: ar.checkout.title, robots: { index: false } };

export default async function CheckoutPage() {
  // Maystro's delegations (refreshed daily). Without them the form falls back to a free-text city.
  const [settings, communes] = await Promise.all([getSettings(), getCommunes()]);
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="text-4xl md:text-5xl">{ar.checkout.title}</h1>
      <CheckoutForm deliveryFee={settings.deliveryFee} deliveryTime={settings.deliveryTime} communes={communes} />
    </div>
  );
}
