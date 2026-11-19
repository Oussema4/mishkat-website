import { and, asc, eq, gte, ne, sql, type SQL } from "drizzle-orm";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { db } from "@/db";
import { drivers, orderItems, orders, products } from "@/db/schema";
import { formatTND } from "@/lib/money";
import { cn } from "@/lib/site";
import { computeStats, daysOfStock, deliveryBreakdown, PERIODS, periodStart, tunisDay, type Period, type StatOrder } from "@/lib/stats";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "الإحصائيات" };

const card = "rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]";
const percent = (v: number | null) => (v === null ? "—" : `${String(v).replace(".", ",")}%`);
const boxesLabel = (n: number) => (n === 1 ? "علبة وحدة" : n === 2 ? "علبتين" : n >= 4 ? "4 علب ولا أكثر" : `${n} علب`);

function Kpi({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className={cn(card, "p-5")}>
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 font-sans text-2xl font-bold tabular", strong && "text-success")}>{value}</p>
      {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
    </div>
  );
}

/** A plain horizontal bar, its length relative to the largest value in its list. */
function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <span className="block h-2.5 w-full overflow-hidden rounded-full bg-mist">
      <span className={cn("block h-full rounded-full bg-ink", className)} style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%` }} />
    </span>
  );
}

export default async function StatsPage({ searchParams }: PageProps<"/admin/stats">) {
  // Every admin page re-checks the session against the database (the layout does not re-run).
  await requireAdmin();
  const params = await searchParams;
  const period: Period = typeof params.p === "string" && params.p in PERIODS ? (params.p as Period) : "30";
  const now = new Date();
  const since = periodStart(period, now);
  const inPeriod: SQL | undefined = since ? gte(orders.createdAt, since) : undefined;

  const [rows, productList, soldRows, driverList] = await Promise.all([
    db
      .select({
        status: orders.status,
        total: orders.total,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        governorate: orders.governorate,
        carrier: orders.carrier,
        driverId: orders.driverId,
        createdAt: orders.createdAt,
        // Written out with table names: inside the sub-query a bare "id" would be the item's own id.
        boxes: sql<number>`coalesce((select sum("oi"."quantity") from "order_items" "oi" where "oi"."order_id" = "orders"."id"), 0)`,
      })
      .from(orders)
      .where(inPeriod),
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id)),
    db
      .select({ productId: orderItems.productId, units: sql<number>`sum(${orderItems.quantity})`, value: sql<number>`sum(${orderItems.lineTotal})` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(ne(orders.status, "cancelled"), inPeriod))
      .groupBy(orderItems.productId),
    db.select({ id: drivers.id, name: drivers.name }).from(drivers),
  ]);

  const list: StatOrder[] = rows.map((r) => ({ ...r, boxes: Number(r.boxes) }));
  const s = computeStats(list);
  const delivery = deliveryBreakdown(list, driverList);
  const first = list.reduce<Date | null>((d, o) => (!d || o.createdAt < d ? o.createdAt : d), null);
  const periodDays = Math.max(1, Math.ceil((now.getTime() - (since ?? first ?? now).getTime()) / 86_400_000));

  // Daily bars for short periods, monthly ones beyond five weeks.
  const monthly = s.days.length > 35;
  const series = monthly
    ? [...s.days.reduce((m, d) => m.set(d.day.slice(0, 7), (m.get(d.day.slice(0, 7)) ?? 0) + d.orders), new Map<string, number>())].map(([day, n]) => ({ day, orders: n }))
    : s.days.map((d) => ({ day: d.day, orders: d.orders }));
  const maxSeries = Math.max(0, ...series.map((d) => d.orders));
  const today = tunisDay(now);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">الإحصائيات</h1>
          <p className="mt-1 text-muted">
            الأرقام من الطلبات اللي جات للسيت. المبالغ بالتوصيل، والطلبات الملغاة ما تتحسبش في الفلوس.
          </p>
        </div>
        <nav aria-label="الفترة" className="flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-paper p-1 shadow-[var(--shadow-soft)]">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <Link
              key={p}
              href={`/admin/stats?p=${p}`}
              aria-current={p === period ? "page" : undefined}
              className={cn("inline-flex min-h-10 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium", p === period ? "bg-ink text-paper" : "hover:bg-mist")}
            >
              {PERIODS[p]}
            </Link>
          ))}
        </nav>
      </header>

      {/* ───── Headline numbers ───── */}
      <section aria-label="أهم الأرقام" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="الطلبات" value={String(s.orders)} note={`${s.liveOrders} شغّالة · ${s.cancelledOrders} ملغاة · ${s.waiting} تستنّى التأكيد`} />
        <Kpi label="العلب المطلوبة" value={String(s.boxes)} note={`المعدّل ${String(s.averageBoxes).replace(".", ",")} علبة في الطلب`} />
        <Kpi label="قيمة الطلبات" value={formatTND(s.value)} note={`منها ${formatTND(s.deliveryFees)} توصيل · معدّل الطلب ${formatTND(s.averageOrder)}`} />
        <Kpi label="فلوس الطلبات المسلّمة" value={formatTND(s.deliveredValue)} note={`${s.deliveredOrders} طلب تسلّم · ${formatTND(s.inProgressValue)} في الطريق`} strong />
      </section>

      <section aria-label="النسب" className="grid gap-4 sm:grid-cols-3">
        <Kpi label="نسبة التأكيد" value={percent(s.confirmRate)} note="من الطلبات اللي تعاملت معاها (موش «طلب جديد»)" />
        <Kpi label="نسبة التسليم" value={percent(s.deliverRate)} note="من الطلبات اللي كملت (تسلّمت ولا تلغات)" />
        <Kpi label="نسبة الإلغاء" value={percent(s.cancelRate)} note="من الطلبات الكل" />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ───── Orders over time ───── */}
        <section aria-labelledby="days-title" className={card}>
          <h2 id="days-title" className="font-sans text-lg font-bold">
            الطلبات {monthly ? "في كل شهر" : "في كل نهار"}
          </h2>
          {series.length === 0 ? (
            <p className="mt-3 text-muted">ما فماش طلبات في الفترة هاذي.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {series.map((d) => (
                <li key={d.day} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                  <span dir="ltr" className={cn("text-end tabular text-muted", d.day === today && "font-bold text-ink")}>
                    {monthly ? d.day : d.day.slice(5).split("-").reverse().join("/")}
                  </span>
                  <Bar value={d.orders} max={maxSeries} className={d.day === today ? "bg-gold-deep" : undefined} />
                  <span className="font-semibold tabular">{d.orders}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-6">
          {/* ───── Statuses ───── */}
          <section aria-labelledby="status-title" className={card}>
            <h2 id="status-title" className="font-sans text-lg font-bold">
              الطلبات حسب الحالة
            </h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-2 text-start font-medium">الحالة</th>
                  <th scope="col" className="py-2 text-end font-medium">العدد</th>
                  <th scope="col" className="py-2 text-end font-medium">القيمة</th>
                </tr>
              </thead>
              <tbody>
                {s.statuses.map((row) => (
                  <tr key={row.status} className="border-t border-line">
                    <td className="py-2">
                      <Link href={`/admin?status=${row.status}`} className="hover:underline">
                        <StatusBadge status={row.status} />
                      </Link>
                    </td>
                    <td className="py-2 text-end font-semibold tabular">{row.orders}</td>
                    <td className="py-2 text-end tabular">{formatTND(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ───── Offers ───── */}
          <section aria-labelledby="mix-title" className={card}>
            <h2 id="mix-title" className="font-sans text-lg font-bold">
              قدّاش من علبة في كل طلب
            </h2>
            <ul className="mt-4 space-y-3">
              {s.mix.map((m) => (
                <li key={m.boxes} className="grid grid-cols-[7rem_1fr_4.5rem] items-center gap-3 text-sm">
                  <span>{boxesLabel(m.boxes)}</span>
                  <Bar value={m.orders} max={Math.max(...s.mix.map((x) => x.orders))} />
                  <span className="text-end tabular">
                    <b>{m.orders}</b> · {percent(m.share)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ───── Delivery ───── */}
        <section aria-labelledby="delivery-title" className={card}>
          <h2 id="delivery-title" className="font-sans text-lg font-bold">
            التوصيل: شكون وصّل وقدّاش
          </h2>
          <p className="mt-1 text-sm text-muted">الطلبات المؤكّدة واللي في الطريق والمسلّمة. «فلوس المسلّمة» هي اللي لازم توصلك من عند الموزّع.</p>
          {delivery.length === 0 ? (
            <p className="mt-3 text-muted">ما فماش طلبات مؤكّدة في الفترة هاذي.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead className="text-muted">
                  <tr>
                    <th scope="col" className="py-2 text-start font-medium">مع</th>
                    <th scope="col" className="py-2 text-end font-medium">تسلّمت</th>
                    <th scope="col" className="py-2 text-end font-medium">فلوس المسلّمة</th>
                    <th scope="col" className="py-2 text-end font-medium">في الطريق</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.map((g) => (
                    <tr key={g.key} className="border-t border-line">
                      <td className="py-2 font-semibold">{g.label}</td>
                      <td className="py-2 text-end tabular">{g.delivered}</td>
                      <td className="py-2 text-end tabular">{formatTND(g.deliveredValue)}</td>
                      <td className="py-2 text-end tabular">
                        {g.open} <span className="text-muted">({formatTND(g.openValue)})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ───── Governorates ───── */}
        <section aria-labelledby="gov-title" className={card}>
          <h2 id="gov-title" className="font-sans text-lg font-bold">
            الولايات اللي تطلب أكثر
          </h2>
          {s.governorates.length === 0 ? (
            <p className="mt-3 text-muted">ما فماش طلبات في الفترة هاذي.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {s.governorates.slice(0, 10).map((g) => (
                <li key={g.name} className="grid grid-cols-[6.5rem_1fr_6.5rem] items-center gap-3 text-sm">
                  <span className="truncate">{g.name}</span>
                  <Bar value={g.orders} max={s.governorates[0].orders} />
                  <span className="text-end tabular">
                    <b>{g.orders}</b> · {formatTND(g.value)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ───── Stock and prices ───── */}
      <section aria-labelledby="stock-title" className={card}>
        <h2 id="stock-title" className="font-sans text-lg font-bold">
          الستوك والأسوام
        </h2>
        <p className="mt-1 text-sm text-muted">الستوك ينقص وقت الطلب ويرجع وقت الإلغاء. «يكفي» محسوب على ريتم البيع في الفترة المختارة.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2 text-start font-medium">المنتج</th>
                <th scope="col" className="py-2 text-start font-medium">السوم والعروض</th>
                <th scope="col" className="py-2 text-end font-medium">في الستوك</th>
                <th scope="col" className="py-2 text-end font-medium">تباع في الفترة</th>
                <th scope="col" className="py-2 text-end font-medium">يكفي</th>
                <th scope="col" className="py-2 text-end font-medium">قيمة الستوك</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((p) => {
                const sold = soldRows.find((r) => r.productId === p.id);
                const units = Number(sold?.units ?? 0);
                const left = daysOfStock(p.stock, units, periodDays);
                return (
                  <tr key={p.id} className="border-t border-line align-top">
                    <td className="py-3">
                      <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      {p.status === "hidden" ? <span className="ms-2 text-muted">(مخفي)</span> : null}
                    </td>
                    <td className="py-3 leading-6">
                      <span className="tabular">علبة: {formatTND(p.price)}</span>
                      {p.bundles.map((b) => (
                        <span key={b.quantity} className="block tabular text-muted">
                          {boxesLabel(b.quantity)}: {formatTND(b.price)} ({formatTND(Math.round(b.price / b.quantity))} للعلبة)
                        </span>
                      ))}
                    </td>
                    <td className={cn("py-3 text-end text-lg font-bold tabular", p.stock <= 5 && "text-danger")}>{p.stock}</td>
                    <td className="py-3 text-end tabular">
                      {units}
                      {sold ? <span className="block text-muted">{formatTND(Number(sold.value))}</span> : null}
                    </td>
                    <td className={cn("py-3 text-end tabular", left !== null && left < 14 && "font-semibold text-danger")}>{left === null ? "—" : `${left} يوم`}</td>
                    <td className="py-3 text-end tabular">{formatTND(p.stock * p.price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
