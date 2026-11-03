import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { pageLocale, type LangParams } from "@/i18n/server";
import { getCommunes } from "@/server/maystro";
import { getSettings } from "@/server/settings";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await pageLocale(params);
  return { title: t.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: LangParams) {
  const { locale, t } = await pageLocale(params);
  // Maystro's delegations (refreshed daily). Without them the form falls back to a free-text city.
  const [settings, communes] = await Promise.all([getSettings(locale), getCommunes()]);
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="text-4xl md:text-5xl">{t.checkout.title}</h1>
      <CheckoutForm deliveryFee={settings.deliveryFee} deliveryTime={settings.deliveryTime} communes={communes} />
    </div>
  );
}
