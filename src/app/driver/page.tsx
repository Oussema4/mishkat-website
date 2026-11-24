import type { Metadata } from "next";
import { Package, RefreshCw } from "lucide-react";
import { formatTND } from "@/lib/money";
import { cn } from "@/lib/site";
import { customRange, PERIODS, periodRange, tunisDay, type Period } from "@/lib/stats";
import { formatTunisianPhone, whatsappLink } from "@/lib/tunisia";
import { doneDriverOrders, driverAccount, openDriverOrders, requireDriver } from "@/server/driver";
import { driverLogout } from "./actions";
import { DriverList, type RecentOrder } from "./driver-list";
import type { DriverOrder } from "./order-card";

export const metadata: Metadata = { title: "طلباتي" };
export const dynamic = "force-dynamic";

/** The day buttons, everything first (the default); numeric keys would otherwise come first. */
const DAY_BUTTONS: Period[] = ["all", "today", "yesterday", "7", "30", "month", "90"];

const time = (d: Date) =>
  d.toLocaleString("ar-TN", { timeZone: "Africa/Tunis", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * The driver's screen: the orders given to him, then the ones delivered or cancelled. A day filter
 * (by order date, like the stats page) narrows both; by default everything shows.
 */
export default async function DriverPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const driver = await requireDriver();
  const params = await searchParams;
  const custom = customRange(params.from, params.to);
  const period: Period | null = custom ? null : typeof params.p === "string" && params.p in PERIODS ? (params.p as Period) : "all";
  const range = custom ?? periodRange(period ?? "all");
  const today = tunisDay(new Date());
  const [open, recent, account] = await Promise.all([
    openDriverOrders(driver.id, range),
    doneDriverOrders(driver.id, driver.name, range),
    driverAccount(driver.id),
  ]);

  const cards: DriverOrder[] = open.map((o) => {
    const name = `${o.firstName} ${o.lastName}`.trim();
    const products = o.items.map((i) => i.name).join("، ");
    return {
      id: o.id,
      reference: o.reference,
      name,
      phone: o.phone,
      phoneLabel: formatTunisianPhone(o.phone),
      place: [o.address, o.city, o.governorate].filter(Boolean).join("، "),
      mapsQuery: [o.address, o.city, o.governorate, "Tunisie"].filter(Boolean).join(", "),
      items: o.items.map((i) => `${i.name} × ${i.quantity}`).join("، "),
      total: formatTND(o.total),
      note: o.note,
      noAnswer: o.noAnswerCount > 0 && o.noAnswerAt ? `ما يهزش ×${o.noAnswerCount} · آخر مرّة ${time(o.noAnswerAt)}` : null,
      onWay: o.onWayAt ? `في الطريق · ${time(o.onWayAt)}` : null,
      // Postponed by the shop (a "no answer" alone stays white).
      waiting: o.status === "postponed",
      whatsapp: whatsappLink(o.phone, `السلام عليكم ${o.firstName}، معاك ${driver.name} موزّع مشكاة. عندي الطلب متاعك (${products}).`),
    };
  });

  const recentRows: RecentOrder[] = recent.map((o) => ({
    id: o.id,
    name: `${o.firstName} ${o.lastName}`.trim(),
    phone: o.phone,
    phoneLabel: formatTunisianPhone(o.phone),
    place: [o.address, o.city, o.governorate].filter(Boolean).join("، "),
    delivered: o.status === "delivered",
    total: formatTND(o.total),
    canUndo: o.canUndo,
  }));

  return (
    <main className="mx-auto max-w-lg px-4 pt-5 pb-16">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">مرحبا {driver.name}</h1>
          <p className="mt-1 text-muted">
            عندك <b className="text-ink tabular">{open.length}</b> {open.length === 1 ? "طلب" : "طلبات"}
          </p>
        </div>
        <a href="/driver" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-4 font-semibold shadow-[var(--shadow-soft)]">
          <RefreshCw aria-hidden className="size-4" />
          حدّث
        </a>
      </header>

      <section aria-label="الحساب" className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <p className="rounded-[var(--radius-md)] bg-paper p-3">
          <span className="flex items-center gap-1.5 text-muted">
            <Package aria-hidden className="size-4" />
            الباكوات اللي عندك
          </span>
          <b className="text-xl tabular">{Math.max(0, account.withHim)}</b>
        </p>
        <div className="rounded-[var(--radius-md)] bg-paper p-3">
          <span className="block text-muted">فلوس الطلبات اللي وصلتهم</span>
          <b className="text-xl tabular">{formatTND(account.cashWithHim)}</b>
          <dl className="mt-2 space-y-1 border-t border-line pt-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">حق الطلبيات</dt>
              <dd className="font-semibold tabular">{formatTND(account.goodsOwed)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">حق التوصيل (ليك)</dt>
              <dd className="font-semibold text-success tabular">{formatTND(account.deliveryEarned)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Days: the stats page periods, or dates picked by hand (one day, or from … to). */}
      <nav aria-label="الأيامات" className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {DAY_BUTTONS.map((p) => (
          <a
            key={p}
            href={p === "all" ? "/driver" : `/driver?p=${p}`}
            aria-current={p === period ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-sm font-medium",
              p === period ? "bg-ink text-paper" : "bg-paper shadow-[var(--shadow-soft)]",
            )}
          >
            {PERIODS[p]}
          </a>
        ))}
      </nav>
      <details open={Boolean(custom)} className="mt-2 rounded-[var(--radius-md)] bg-paper px-3 shadow-[var(--shadow-soft)]">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
          {custom
            ? custom.from === custom.to
              ? `نهار ${custom.from.split("-").reverse().join("/")}`
              : `من ${custom.from.split("-").reverse().join("/")} حتى ${custom.to.split("-").reverse().join("/")}`
            : "اختار نهار…"}
        </summary>
        <form action="/driver" className="flex flex-wrap items-end gap-2 pb-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">من نهار</span>
            <input type="date" name="from" required max={today} defaultValue={custom?.from ?? ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">حتى نهار (اختياري)</span>
            <input type="date" name="to" max={today} defaultValue={custom && custom.to !== custom.from ? custom.to : ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2" />
          </label>
          <button type="submit" className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] bg-ink px-4 text-sm font-medium text-paper">
            عرض
          </button>
        </form>
      </details>

      <DriverList orders={cards} recent={recentRows} filtered={period !== "all"} />

      <form action={driverLogout} className="mt-10 text-center">
        <button type="submit" className="min-h-10 text-sm text-muted underline-offset-4 hover:underline">
          خروج
        </button>
      </form>
    </main>
  );
}
