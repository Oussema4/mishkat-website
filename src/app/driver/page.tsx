import type { Metadata } from "next";
import { Package, RefreshCw } from "lucide-react";
import { formatTND } from "@/lib/money";
import { formatTunisianPhone, whatsappLink } from "@/lib/tunisia";
import { driverAccount, openDriverOrders, recentDriverOrders, requireDriver } from "@/server/driver";
import { driverLogout, undoMark } from "./actions";
import { OrderCard, type DriverOrder } from "./order-card";

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
      whatsapp: whatsappLink(o.phone, `السلام عليكم ${o.firstName}، معاك ${driver.name} موزّع مشكاة. عندي الطلب متاعك (${products}).`),
    };
  });

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
        <p className="rounded-[var(--radius-md)] bg-paper p-3">
          <span className="block text-muted">فلوس الطلبات اللي وصلتهم</span>
          <b className="text-xl tabular">{formatTND(account.cashWithHim)}</b>
        </p>
      </section>

      {cards.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-lg)] bg-paper p-6 text-center text-muted">ما عندك حتى طلب توّا.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {cards.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}

      {recent.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-sans text-base font-bold">كمّلتهم اليوم</h2>
          <ul className="mt-2 space-y-2">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-paper p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{`${o.firstName} ${o.lastName}`.trim()}</p>
                  <p className={o.status === "delivered" ? "text-sm text-success" : "text-sm text-danger"}>
                    {o.status === "delivered" ? `وصلت · ${formatTND(o.total)}` : "تم الإلغاء"}
                  </p>
                </div>
                <form action={undoMark}>
                  <input type="hidden" name="orderId" value={o.id} />
                  <button type="submit" className="min-h-10 rounded-[var(--radius-md)] px-3 text-sm font-medium text-muted hover:bg-mist hover:text-ink">
                    غلطت، رجّعها
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form action={driverLogout} className="mt-10 text-center">
        <button type="submit" className="min-h-10 text-sm text-muted underline-offset-4 hover:underline">
          خروج
        </button>
      </form>
    </main>
  );
}
