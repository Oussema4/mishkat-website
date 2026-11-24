import { and, desc, eq } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { db } from "@/db";
import { driverLedger, drivers, orders } from "@/db/schema";
import { formatDateTime } from "@/lib/dates";
import { formatTND } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { formatTunisianPhone } from "@/lib/tunisia";
import { deleteDriverLedger, removeDriverCode } from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { driverAccount } from "@/server/driver";
import { DriverCodeForm, LedgerForm, SettleCash } from "./driver-forms";

export const metadata = { title: "حساب الموزّع" };

const card = "rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]";

const KIND_LABEL = { boxesGiven: "عطيتو باكوات", boxesReturned: "رجّعلي باكوات", cashReceived: "خلّصني فلوس", deliverySettled: "خذا حق التوصيل" } as const;

/**
 * One delivery person: his access to the driver app, the account between the shop and him
 * (boxes and cash), and his orders.
 */
export default async function DriverAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
  if (!driver) notFound();
  const [account, ledger, driverOrders] = await Promise.all([
    driverAccount(id),
    db.select().from(driverLedger).where(eq(driverLedger.driverId, id)).orderBy(desc(driverLedger.createdAt), desc(driverLedger.id)).limit(200),
    db
      .select({
        id: orders.id,
        reference: orders.reference,
        firstName: orders.firstName,
        lastName: orders.lastName,
        governorate: orders.governorate,
        total: orders.total,
        status: orders.status,
        noAnswerCount: orders.noAnswerCount,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(eq(orders.driverId, id)))
      .orderBy(desc(orders.updatedAt))
      .limit(100),
  ]);
  const open = driverOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const done = driverOrders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  const stat = (label: string, value: string, tone?: string) => (
    <div className="rounded-[var(--radius-md)] bg-mist p-3">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold tabular ${tone ?? ""}`}>{value}</p>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <Link href="/admin/maystro" className="inline-flex min-h-10 items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowRight aria-hidden className="size-4" />
          التوصيل
        </Link>
        <h1 className="text-3xl">{driver.name}</h1>
        <p className="mt-1 text-muted">
          {driver.phone ? (
            <span dir="ltr" className="tabular">
              {formatTunisianPhone(driver.phone)}
            </span>
          ) : null}
          {driver.active ? "" : " · موقوف"}
        </p>
      </header>

      <section className={card}>
        <h2 className="font-sans text-lg font-bold">الحسبة</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {stat("باكوات عطيتهملو", String(account.given))}
          {stat("وصّل منهم", String(account.deliveredBoxes), "text-success")}
          {stat("رجّعهم", String(account.returned))}
          {stat("باقين عندو", String(account.withHim), account.withHim < 0 ? "text-danger" : undefined)}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {stat(`فلوس ${account.deliveredOrders} طلب وصّلهم`, formatTND(account.cashCollected))}
          {stat("خلّصك", formatTND(account.cashReceived), "text-success")}
          {stat("باقي عندو", formatTND(account.cashWithHim), account.cashWithHim > 0 ? "text-danger" : undefined)}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {stat("منها حق الطلبيات (باقي عليه للمتجر)", formatTND(account.goodsOwed), account.goodsOwed > 0 ? "text-danger" : undefined)}
          {stat("منها حق التوصيل (ليه)", formatTND(account.deliveryEarned), "text-success")}
        </div>
        {account.goodsOwed > 0 || account.deliveryEarned > 0 ? (
          <SettleCash
            driverId={driver.id}
            goods={account.goodsOwed}
            delivery={account.deliveryEarned}
            goodsLabel={formatTND(account.goodsOwed)}
            deliveryLabel={formatTND(account.deliveryEarned)}
          />
        ) : null}
        <p className="mt-3 text-sm leading-6 text-muted">
          «وصّل منهم» تتحسب من الطلبات اللي علّم عليها «وصلت». الفلوس هي المجموع اللي يخلّصو الحريف: حق الطلبيات يرجع للمتجر
          (ننقصو منو اللي خلّصك)، وحق التوصيل يبقى عند الموزّع. كي يجيبلك الفلوس اضغط «تسلّمت الفلوس» والحساب يرجع للصفر.
          {account.withHim < 0 ? " باقين عندو بالسالب: وصّل أكثر ممّا عطيتو، زيد الباكوات اللي عطيتهملو." : ""}
        </p>

        <h3 className="mt-6 font-sans font-bold">سجّل حاجة جديدة</h3>
        <LedgerForm driverId={driver.id} />

        {ledger.length > 0 ? (
          <ul className="mt-6 divide-y divide-line">
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">
                    {KIND_LABEL[l.kind]}:{" "}
                    <b className="tabular">{l.kind === "cashReceived" || l.kind === "deliverySettled" ? formatTND(l.amount) : `${l.amount} باكو`}</b>
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateTime(l.createdAt)}
                    {l.adminName ? ` · ${l.adminName}` : ""}
                    {l.note ? ` · ${l.note}` : ""}
                  </p>
                </div>
                <form action={deleteDriverLedger}>
                  <input type="hidden" name="id" value={l.id} />
                  <button type="submit" className="min-h-10 rounded-[var(--radius-md)] px-3 text-sm text-muted hover:bg-mist hover:text-danger">
                    فسخ
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={card}>
        <h2 className="font-sans text-lg font-bold">تطبيق الموزّع</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          {driver.accessCodeHash
            ? "عندو كود دخول. يشوف كان الطلبات اللي عطيتهملو، ويعلّم: وصلت، ما يهزش، تم الإلغاء."
            : "ما عندوش كود دخول. اعملو كود وابعثهولو مع التطبيق."}
        </p>
        <DriverCodeForm driverId={driver.id} hasCode={Boolean(driver.accessCodeHash)} siteUrl={siteUrl()} />
        {driver.accessCodeHash ? (
          <form action={removeDriverCode} className="mt-2">
            <input type="hidden" name="id" value={driver.id} />
            <button type="submit" className="min-h-10 text-sm font-medium text-danger hover:underline">
              نحّي الدخول (التليفون ضاع، ولا ما عادش يخدم)
            </button>
          </form>
        ) : null}
      </section>

      <section className={card}>
        <h2 className="font-sans text-lg font-bold">الطلبات اللي عندو ({open.length})</h2>
        <OrderList rows={open} />
        {done.length > 0 ? (
          <>
            <h3 className="mt-6 font-sans font-bold">آخر اللي كمّلهم</h3>
            <OrderList rows={done.slice(0, 30)} />
          </>
        ) : null}
      </section>
    </div>
  );
}

function OrderList({
  rows,
}: {
  rows: { id: number; reference: string; firstName: string; lastName: string; governorate: string; total: number; status: (typeof orders.$inferSelect)["status"]; noAnswerCount: number }[];
}) {
  if (rows.length === 0) return <p className="mt-3 text-muted">ما فماش.</p>;
  return (
    <ul className="mt-3 divide-y divide-line">
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-mist">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {o.firstName} {o.lastName}
                <span className="ms-2 text-sm text-muted">{o.governorate}</span>
              </p>
              <p className="text-sm text-muted tabular" dir="ltr">
                {o.reference}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {o.noAnswerCount > 0 ? <span className="rounded-full bg-[#fdeb9c] px-2 py-0.5 text-xs font-medium text-[#5c4700]">ما يهزش ×{o.noAnswerCount}</span> : null}
              <StatusBadge status={o.status} />
              <span className="font-semibold tabular">{formatTND(o.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
