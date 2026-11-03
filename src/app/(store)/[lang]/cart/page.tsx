import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { pageLocale, type LangParams } from "@/i18n/server";
import { getSettings } from "@/server/settings";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await pageLocale(params);
  return { title: t.cart.title, robots: { index: false } };
}

export default async function CartPage({ params }: LangParams) {
  const { t } = await pageLocale(params);
  const settings = await getSettings();
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="text-4xl md:text-5xl">{t.cart.title}</h1>
      <CartView deliveryFee={settings.deliveryFee} />
    </div>
  );
}
