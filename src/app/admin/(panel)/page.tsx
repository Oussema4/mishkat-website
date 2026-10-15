import { and, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { db } from "@/db";
import { ORDER_STATUSES, orders, products, type OrderStatus } from "@/db/schema";
import { ar } from "@/i18n/ar";
import { formatDateTime } from "@/lib/dates";
import { formatTND } from "@/lib/money";
import { cn } from "@/lib/site";
import { formatTunisianPhone } from "@/lib/tunisia";

const PAGE_SIZE = 25;

export default async function OrdersPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const status = ORDER_STATUSES.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : null;
  const page = Math.max(1, Number(params.page) || 1);

  const filters: SQL[] = [];
  if (status) filters.push(eq(orders.status, status));
  if (q) {
    const digits = q.replace(/\D/g, "");
    const term = `%${q}%`;
    filters.push(
      or(
        like(orders.reference, `%${q.toUpperCase()}%`),
        like(sql`${orders.firstName} || ' ' || ${orders.lastName}`, term),
        like(orders.city, term),
        digits.length >= 3 ? like(orders.phone, `%${digits.slice(-8)}%`) : undefined,
      )!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }], counts, lowStock] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db.select({ id: products.id, name: products.name, stock: products.stock }).from(products).where(and(eq(products.status, "active"), sql`${products.stock} <= 5`)),
  ]);

  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?.n ?? 0;
  const allCount = counts.reduce((n, c) => n + c.n, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (patch: Record<string, string | number | null>) => {
    const sp = new URLSearchParams();
    const merged = { q, status, page: 1, ...patch } as Record<string, string | number | null>;
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === 1)) sp.set(k, String(v));
    const s = sp.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">الطلبات</h1>
          <p className="mt-1 text-muted">
            {countOf("new") > 0 ? (
              <>
                لديك <strong className="text-ink">{newOrdersPhrase(countOf("new"))}</strong> بانتظار التأكيد.
              </>
            ) : (
              "لا توجد طلبات جديدة بانتظار التأكيد."
            )}
          </p>
        </div>
        <form role="search" action="/admin" className="relative w-full sm:w-80">
          <label htmlFor="order-search" className="sr-only">
            ابحث في الطلبات
          </label>
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            id="order-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="رقم الطلب، الاسم، الهاتف، المدينة"
            className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper ps-10 pe-3 outline-none focus:border-ink"
          />
          {status ? <input type="hidden" name="status" value={status} /> : null}
        </form>
      </header>

      {lowStock.length > 0 ? (
        <p role="status" className="rounded-[var(--radius-md)] bg-warning-bg p-4 text-warning">
          تنبيه مخزون:{" "}
          {lowStock.map((p, i) => (
            <span key={p.id}>
              {i > 0 ? "، " : ""}
              <Link href={`/admin/products/${p.id}`} className="font-semibold underline underline-offset-4">
                {p.name}
              </Link>{" "}
              ({p.stock <= 0 ? "نفد" : `بقي ${p.stock}`})
            </span>
          ))}
        </p>
      ) : null}

      <nav aria-label="تصفية حسب الحالة" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        <StatusTab href={href({ status: null })} active={!status} label="الكل" n={allCount} />
        {ORDER_STATUSES.map((s) => (
          <StatusTab key={s} href={href({ status: s })} active={status === s} label={ar.status[s]} n={countOf(s)} />
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] bg-paper p-10 text-center text-muted">
          {q || status ? "لا توجد طلبات تطابق البحث." : "لم تصل أي طلبات بعد."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-soft)]">
          {/* Desktop table */}
          <table className="hidden w-full text-start md:table">
            <thead className="border-b border-line bg-mist/60 text-sm text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">الطلب</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">الزبون</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">الولاية</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">المجموع</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="group relative hover:bg-mist/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold tabular after:absolute after:inset-0" dir="ltr">
                      {o.reference}
                    </Link>
                    <div className="text-sm text-muted">{formatDateTime(o.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {o.firstName} {o.lastName}
                    </div>
                    <div dir="ltr" className="text-end text-sm text-muted tabular">
                      {formatTunisianPhone(o.phone)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.governorate}
                    <div className="text-sm text-muted">{o.city}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular">{formatTND(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="divide-y divide-line md:hidden">
            {rows.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block space-y-1 p-4 active:bg-mist">
                  <div className="flex items-center justify-between gap-3">
                    <span dir="ltr" className="font-semibold tabular">
                      {o.reference}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {o.firstName} {o.lastName} · {o.governorate}
                    </span>
                    <span className="font-semibold tabular">{formatTND(o.total)}</span>
                  </div>
                  <div className="text-sm text-muted">{formatDateTime(o.createdAt)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="الصفحات" className="flex items-center justify-between">
          <PageLink href={href({ page: page - 1 })} disabled={page <= 1} label="السابق" icon="prev" />
          <span className="text-sm text-muted tabular">
            صفحة {page} من {pages}
          </span>
          <PageLink href={href({ page: page + 1 })} disabled={page >= pages} label="التالي" icon="next" />
        </nav>
      ) : null}
    </div>
  );
}

/** Arabic number agreement: 1 طلب جديد، 2 طلبان، 3–10 طلبات، 11+ طلبًا. */
function newOrdersPhrase(n: number) {
  if (n === 1) return "طلب جديد واحد";
  if (n === 2) return "طلبان جديدان";
  if (n <= 10) return `${n} طلبات جديدة`;
  return `${n} طلبًا جديدًا`;
}

function StatusTab({ href, active, label, n }: { href: string; active: boolean; label: string; n: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors",
        active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-line/60",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-xs tabular", active ? "bg-paper/20" : "bg-mist")}>{n}</span>
    </Link>
  );
}

function PageLink({ href, disabled, label, icon }: { href: string; disabled: boolean; label: string; icon: "prev" | "next" }) {
  const Icon = icon === "prev" ? ChevronRight : ChevronLeft;
  if (disabled) {
    return (
      <span aria-disabled className="inline-flex min-h-11 items-center gap-1 px-3 text-muted/60">
        {icon === "prev" ? <Icon aria-hidden className="size-4" /> : null}
        {label}
        {icon === "next" ? <Icon aria-hidden className="size-4" /> : null}
      </span>
    );
  }
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] bg-paper px-3 font-medium hover:bg-line/60">
      {icon === "prev" ? <Icon aria-hidden className="size-4" /> : null}
      {label}
      {icon === "next" ? <Icon aria-hidden className="size-4" /> : null}
    </Link>
  );
}
