import { asc, eq } from "drizzle-orm";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderTotals } from "@/components/store/order-summary";
import { db } from "@/db";
import { orderItems, orders, orderStatusHistory } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { formatDateTime } from "@/lib/dates";
import { formatTND } from "@/lib/money";
import { formatTunisianPhone, whatsappLink } from "@/lib/tunisia";
import { StatusForm } from "./status-form";

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) notFound();
  const [items, history] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
  ]);

  const waText = `السلام عليكم ${order.firstName}، معك مشكاة بخصوص طلبك رقم ${order.reference} (${formatTND(order.total)}).`;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowRight aria-hidden className="size-4" />
        كل الطلبات
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 dir="ltr" className="text-end font-sans text-3xl font-bold tabular">
            {order.reference}
          </h1>
          <p className="mt-1 text-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="customer-title" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-soft)]">
            <h2 id="customer-title" className="font-sans text-lg font-bold">
              الزبون والتوصيل
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">الاسم واللقب</dt>
                <dd className="text-lg font-semibold">
                  {order.firstName} {order.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">الهاتف</dt>
                <dd dir="ltr" className="text-end text-lg font-semibold tabular">
                  {formatTunisianPhone(order.phone)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted">العنوان</dt>
                <dd className="flex gap-2 leading-7">
                  <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-gold-deep" />
                  <span>
                    {order.address}، {order.city}، {order.governorate}
                  </span>
                </dd>
              </div>
              {order.note ? (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted">ملاحظة الزبون</dt>
                  <dd className="rounded-[var(--radius-md)] bg-sand p-3 leading-7">{order.note}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`tel:+216${order.phone}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-ink px-4 font-medium hover:bg-ink hover:text-paper"
              >
                <Phone aria-hidden className="size-4" />
                اتصال
              </a>
              <a
                href={whatsappLink(order.phone, waText)}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-whatsapp px-4 font-medium text-paper hover:bg-whatsapp-deep"
              >
                <WhatsAppIcon className="size-4" />
                واتساب
              </a>
            </div>
          </section>

          <section aria-labelledby="items-title" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-soft)]">
            <h2 id="items-title" className="font-sans text-lg font-bold">
              المنتجات
            </h2>
            <table className="mt-4 w-full">
              <thead className="text-sm text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="pb-2 text-start font-medium">المنتج</th>
                  <th scope="col" className="pb-2 text-start font-medium">الكمية</th>
                  <th scope="col" className="pb-2 text-start font-medium">سعر القطعة</th>
                  <th scope="col" className="pb-2 text-end font-medium">المجموع</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-line">
                    <td className="py-3 font-medium">{i.productName}</td>
                    <td className="py-3">{i.quantity}</td>
                    <td className="py-3">{formatTND(i.unitPrice)}</td>
                    <td className="py-3 text-end">{formatTND(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 sm:ms-auto sm:max-w-xs">
              <OrderTotals subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} />
            </div>
            <p className="mt-4 text-sm text-muted">طريقة الدفع: {ar.checkout.paymentCod}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="status-title" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-soft)]">
            <h2 id="status-title" className="font-sans text-lg font-bold">
              تغيير الحالة
            </h2>
            <StatusForm orderId={order.id} current={order.status} />
          </section>

          <section aria-labelledby="history-title" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-soft)]">
            <h2 id="history-title" className="font-sans text-lg font-bold">
              سجل الحالات
            </h2>
            <ol className="mt-4 space-y-3 border-s-2 border-line ps-4">
              {history.map((h) => (
                <li key={h.id}>
                  <StatusBadge status={h.toStatus as typeof order.status} />
                  <p className="mt-1 text-sm text-muted">
                    {formatDateTime(h.createdAt)} · {h.adminName || "—"}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
