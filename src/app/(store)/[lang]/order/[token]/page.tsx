import type { Metadata } from "next";
import { CircleCheck, Truck, Wallet } from "lucide-react";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { ClearCart } from "@/components/store/clear-cart";
import { PixelEvent } from "@/components/store/meta-pixel";
import { pixelValue } from "@/lib/meta-pixel";
import { OrderTotals } from "@/components/store/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { fill } from "@/i18n/ar";
import { pageLocale } from "@/i18n/server";
import { MAYSTRO_WILAYAS } from "@/lib/maystro";
import type { Governorate } from "@/lib/tunisia";
import { formatTND } from "@/lib/money";
import { whatsappLink } from "@/lib/tunisia";
import { getSettings } from "@/server/settings";

type Props = { params: Promise<{ lang: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await pageLocale(params);
  return { title: t.confirmation.title, robots: { index: false, follow: false } };
}

/** Only reachable with the unguessable token returned after the order was saved. */
export default async function OrderConfirmationPage({ params }: Props) {
  const { token } = await params;
  const { locale, t, href } = await pageLocale(params);
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();

  const [order] = await db.select().from(orders).where(eq(orders.publicToken, token)).limit(1);
  if (!order) notFound();
  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getSettings(locale),
  ]);

  // Orders keep the Arabic product name; the French and English pages show the translated one.
  const ids = items.map((i) => i.productId).filter((n): n is number => n !== null);
  const names =
    locale === "ar" || ids.length === 0
      ? []
      : await db.select({ id: products.id, translations: products.translations }).from(products).where(inArray(products.id, ids));
  const itemName = (i: (typeof items)[number]) =>
    (locale !== "ar" && names.find((n) => n.id === i.productId)?.translations?.[locale]?.name?.trim()) || i.productName;
  // Governorates are stored in Arabic; French and English pages show their Latin name.
  const governorate = locale === "ar" ? order.governorate : (MAYSTRO_WILAYAS[order.governorate as Governorate]?.name ?? order.governorate);

  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <ClearCart />
      {/* One Purchase per order: the order reference is the event id, and reopening the page sends nothing */}
      <PixelEvent
        event="Purchase"
        onceKey={`purchase:${order.reference}`}
        params={{
          content_ids: items.map((i) => i.productId).filter((id): id is number => id !== null).map(String),
          content_type: "product",
          num_items: items.reduce((n, i) => n + i.quantity, 0),
          value: pixelValue(order.total),
        }}
      />
      <CircleCheck aria-hidden className="size-14 text-success" strokeWidth={1.5} />
      <h1 className="mt-5 text-4xl md:text-5xl">{t.confirmation.title}</h1>
      <p className="mt-4 text-lg text-muted">{fill(t.confirmation.lead, { name: order.firstName })}</p>

      <div className="mt-8 inline-flex flex-col rounded-[var(--radius-md)] border border-gold/40 bg-ink-soft px-5 py-3">
        <span className="text-sm text-muted">{t.confirmation.reference}</span>
        <span dir="ltr" className="text-2xl font-bold tabular">
          {order.reference}
        </span>
      </div>

      <ul className="mt-8 space-y-4 text-lg">
        <li className="flex gap-3">
          <Wallet aria-hidden className="mt-1 size-6 shrink-0 text-gold-deep" strokeWidth={1.5} />
          <span>{fill(t.confirmation.payment, { total: formatTND(order.total, locale) })}</span>
        </li>
        <li className="flex gap-3">
          <Truck aria-hidden className="mt-1 size-6 shrink-0 text-gold-deep" strokeWidth={1.5} />
          <span>{fill(t.confirmation.delivery, { time: settings.deliveryTime, place: [order.city, governorate].join(t.common.listSeparator) })}</span>
        </li>
      </ul>

      <section aria-labelledby="items-title" className="mt-10 rounded-[var(--radius-lg)] bg-mist p-6">
        <h2 id="items-title" className="font-sans text-lg font-bold">
          {t.confirmation.items}
        </h2>
        <ul className="mt-4 space-y-2 border-b border-line pb-4">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 tabular">
              <span>
                {itemName(i)} × {i.quantity}
              </span>
              <span>{formatTND(i.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <OrderTotals subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} locale={locale} />
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        {settings.whatsapp ? (
          <a
            href={whatsappLink(settings.whatsapp, fill(t.confirmation.whatsappMessage, { ref: order.reference }))}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] bg-[#1f8f4e] px-5 font-semibold text-paper hover:bg-[#187540]"
          >
            <WhatsAppIcon className="size-5" />
            {t.confirmation.whatsapp}
          </a>
        ) : null}
        <ButtonLink href={href("/")} variant="outline">
          {t.confirmation.back}
        </ButtonLink>
      </div>
    </div>
  );
}
