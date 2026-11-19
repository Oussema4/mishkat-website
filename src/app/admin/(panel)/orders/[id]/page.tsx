import { and, asc, desc, eq, ne } from "drizzle-orm";
import { ArrowRight, Phone, Repeat2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderTotals } from "@/components/store/order-summary";
import { db } from "@/db";
import { drivers, orderItems, orders, orderStatusHistory } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { formatDateTime } from "@/lib/dates";
import { formatTND } from "@/lib/money";
import { whatsappLink } from "@/lib/tunisia";
import { maystroStatusLabel } from "@/lib/maystro";
import { getCommunes, maystroEnabled, syncOrderFromMaystro } from "@/server/maystro";
import { CustomerDetails } from "./customer-form";
import { DeliveryPanel } from "./delivery-panel";
import { StatusForm } from "./status-form";
import { requireAdmin } from "@/server/auth";

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  // Every admin page re-checks the session against the database: the layout does not re-run on
  // client-side navigation, so a disabled or signed-out admin must be stopped here too.
  await requireAdmin();
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();
  const load = async () => (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  let order = await load();
  if (!order) notFound();
  // A parcel still on its way: re-read it from Maystro first when its status is over 2 minutes
  // old, so the page (and the order status that follows Maystro) is current. Waits 4 s at most.
  const stale = !order.maystroSyncedAt || Date.now() - order.maystroSyncedAt.getTime() > 2 * 60_000;
  if (maystroEnabled() && order.maystroState === "sent" && order.status !== "delivered" && order.status !== "cancelled" && stale) {
    await Promise.race([syncOrderFromMaystro(order.id), new Promise((resolve) => setTimeout(resolve, 4000))]);
    order = (await load()) ?? order;
  }
  const [items, history, allDrivers, samePhone] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
    db.select({ id: drivers.id, name: drivers.name, active: drivers.active }).from(drivers).orderBy(asc(drivers.id)),
    // The customer's other orders (same phone): ordered twice by mistake, or a returning customer.
    db
      .select({ id: orders.id, reference: orders.reference, status: orders.status, total: orders.total, createdAt: orders.createdAt })
      .from(orders)
      .where(and(eq(orders.phone, order.phone), ne(orders.id, order.id)))
      .orderBy(desc(orders.createdAt))
      .limit(10),
  ]);

  // The customer's details can be corrected until the order is confirmed (and never once at Maystro).
  const editable = (order.status === "new" || order.status === "postponed") && order.maystroState !== "sent";
  const communes = editable ? await getCommunes() : null;

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
          <section aria-labelledby="customer-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
            <h2 id="customer-title" className="font-sans text-lg font-bold">
              الزبون والتوصيل
            </h2>
            {samePhone.length > 0 ? (
              <div role="note" className="mt-4 rounded-[var(--radius-md)] border border-[#f7b1b1] bg-[#fdeaea] p-4">
                <p className="flex items-center gap-2 font-semibold text-[#7a1616]">
                  <Repeat2 aria-hidden className="size-5" />
                  حريف مكرّر: نفس الرقم في {samePhone.length === 1 ? "طلب آخر" : `${samePhone.length} طلبات أخرى`}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {samePhone.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/orders/${o.id}`} dir="ltr" className="font-semibold tabular underline underline-offset-4">
                        {o.reference}
                      </Link>
                      <span className="text-muted">{formatDateTime(o.createdAt)}</span>
                      <span className="tabular">{formatTND(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <CustomerDetails
              orderId={order.id}
              customer={{
                firstName: order.firstName,
                lastName: order.lastName,
                phone: order.phone,
                governorate: order.governorate,
                city: order.city,
                communeId: order.communeId,
                address: order.address,
                note: order.note,
              }}
              editable={editable}
              communes={communes}
            />
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
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[#1f8f4e] px-4 font-medium text-paper hover:bg-[#187540]"
              >
                <WhatsAppIcon className="size-4" />
                واتساب
              </a>
            </div>
          </section>

          <section aria-labelledby="items-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
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
                    <td className="py-3 text-end">
                      {formatTND(i.lineTotal)}
                      {i.lineTotal < i.unitPrice * i.quantity ? <span className="block text-xs text-muted">بعرض الكمية</span> : null}
                    </td>
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
          <section aria-labelledby="status-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
            <h2 id="status-title" className="font-sans text-lg font-bold">
              حالة الطلب
            </h2>
            <StatusForm orderId={order.id} current={order.status} />
          </section>

          <section aria-labelledby="delivery-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
            <h2 id="delivery-title" className="font-sans text-lg font-bold">
              التوصيل
            </h2>
            <DeliveryPanel
              orderId={order.id}
              carrier={order.carrier}
              confirmed={order.status === "confirmed"}
              cancelled={order.status === "cancelled"}
              drivers={allDrivers.filter((d) => d.active).map(({ id, name }) => ({ id, name }))}
              driver={allDrivers.find((d) => d.id === order.driverId) ?? null}
              maystro={{
                enabled: maystroEnabled(),
                state: order.maystroState,
                tracking: order.maystroTracking,
                statusLabel: maystroStatusLabel(order.maystroStatus),
                error: order.maystroError,
                syncedAt: order.maystroSyncedAt ? formatDateTime(order.maystroSyncedAt) : null,
              }}
            />
          </section>

          <section aria-labelledby="history-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
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
