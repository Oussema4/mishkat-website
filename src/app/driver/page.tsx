import type { Metadata } from "next";
import { Package, RefreshCw } from "lucide-react";
import { formatTND } from "@/lib/money";
import { formatTunisianPhone, whatsappLink } from "@/lib/tunisia";
import { driverAccount, openDriverOrders, recentDriverOrders, requireDriver } from "@/server/driver";
import { driverLogout } from "./actions";
import { DriverList, type RecentOrder } from "./driver-list";
import type { DriverOrder } from "./order-card";

export const metadata: Metadata = { title: "طلباتي" };
export const dynamic = "force-dynamic";

const time = (d: Date) =>
  d.toLocaleString("ar-TN", { timeZone: "Africa/Tunis", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/** The driver's screen: the orders given to him, then what he marked in the last day. */
export default async function DriverPage() {
  const driver = await requireDriver();
  const [open, recent, account] = await Promise.all([
    openDriverOrders(driver.id),
    recentDriverOrders(driver.id, driver.name),
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
      // Put off: the customer didn't answer, or the shop set the order "postponed".
      waiting: o.noAnswerCount > 0 || o.status === "postponed",
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

      <DriverList orders={cards} recent={recentRows} />

      <form action={driverLogout} className="mt-10 text-center">
        <button type="submit" className="min-h-10 text-sm text-muted underline-offset-4 hover:underline">
          خروج
        </button>
      </form>
    </main>
  );
}
