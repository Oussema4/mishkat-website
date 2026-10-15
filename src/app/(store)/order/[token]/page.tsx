import type { Metadata } from "next";
import { CircleCheck, Truck, Wallet } from "lucide-react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { ClearCart } from "@/components/store/clear-cart";
import { OrderTotals } from "@/components/store/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { ar, fill } from "@/i18n/ar";
import { formatTND } from "@/lib/money";
import { whatsappLink } from "@/lib/tunisia";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: ar.confirmation.title, robots: { index: false, follow: false } };

/** Only reachable with the unguessable token returned after the order was saved. */
export default async function OrderConfirmationPage({ params }: PageProps<"/order/[token]">) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();

  const [order] = await db.select().from(orders).where(eq(orders.publicToken, token)).limit(1);
  if (!order) notFound();
  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getSettings(),
  ]);

  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <ClearCart />
      <CircleCheck aria-hidden className="size-14 text-success" strokeWidth={1.5} />
      <h1 className="mt-5 text-4xl md:text-5xl">{ar.confirmation.title}</h1>
      <p className="mt-4 text-lg text-muted">{fill(ar.confirmation.lead, { name: order.firstName })}</p>

      <div className="mt-8 inline-flex flex-col rounded-[var(--radius-md)] border-2 border-ink px-5 py-3">
        <span className="text-sm text-muted">{ar.confirmation.reference}</span>
        <span dir="ltr" className="text-2xl font-bold tabular">
          {order.reference}
        </span>
      </div>

      <ul className="mt-8 space-y-4 text-lg">
        <li className="flex gap-3">
          <Wallet aria-hidden className="mt-1 size-6 shrink-0 text-gold-deep" strokeWidth={1.75} />
          <span>{fill(ar.confirmation.payment, { total: formatTND(order.total) })}</span>
        </li>
        <li className="flex gap-3">
          <Truck aria-hidden className="mt-1 size-6 shrink-0 text-gold-deep" strokeWidth={1.75} />
          <span>{fill(ar.confirmation.delivery, { time: settings.deliveryTime, place: `${order.city}، ${order.governorate}` })}</span>
        </li>
      </ul>

      <section aria-labelledby="items-title" className="mt-10 rounded-[var(--radius-lg)] bg-mist p-6">
        <h2 id="items-title" className="font-sans text-lg font-bold">
          {ar.confirmation.items}
        </h2>
        <ul className="mt-4 space-y-2 border-b border-line pb-4">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 tabular">
              <span>
                {i.productName} × {i.quantity}
              </span>
              <span>{formatTND(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <OrderTotals subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} />
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        {settings.whatsapp ? (
          <a
            href={whatsappLink(settings.whatsapp, fill(ar.confirmation.whatsappMessage, { ref: order.reference }))}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] bg-[#1f8f4e] px-5 font-semibold text-paper hover:bg-[#187540]"
          >
            <WhatsAppIcon className="size-5" />
            {ar.confirmation.whatsapp}
          </a>
        ) : null}
        <ButtonLink href="/" variant="outline">
          {ar.confirmation.back}
        </ButtonLink>
      </div>
    </div>
  );
}
