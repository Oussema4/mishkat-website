import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { CopyButton } from "@/components/admin/copy-button";
import { db } from "@/db";
import { checkoutLeads } from "@/db/schema";
import { formatDateTime } from "@/lib/dates";
import { formatTND } from "@/lib/money";
import { cn } from "@/lib/site";
import { formatTunisianPhone, whatsappLink } from "@/lib/tunisia";
import { dismissLead } from "@/app/admin/actions";
import { requireAdmin } from "@/server/auth";
import { ABANDONED_AFTER_MS } from "@/server/leads";

export const metadata = { title: "ما كمّلوش" };

const card = "rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-soft)]";

/** "منذ 5 دقائق" style age, in Derja. */
function ago(d: Date, now: number) {
  const min = Math.max(0, Math.round((now - d.getTime()) / 60_000));
  if (min < 1) return "توّا";
  if (min < 60) return `قبل ${min} دقيقة`;
  const h = Math.round(min / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.round(h / 24)} يوم`;
}

/**
 * Customers who typed their phone number in the order form but didn't press "confirm order":
 * call them back. A checkout shows as abandoned 15 minutes after its last change with no order.
 */
export default async function AbandonedPage({ searchParams }: PageProps<"/admin/abandoned">) {
  await requireAdmin();
  const params = await searchParams;
  const showHandled = params.show === "handled";
  const now = Date.now();
  const week = new Date(now - 7 * 86_400_000);

  const [leads, [summary]] = await Promise.all([
    db
      .select()
      .from(checkoutLeads)
      .where(and(isNull(checkoutLeads.orderId), eq(checkoutLeads.dismissed, showHandled), gte(checkoutLeads.createdAt, new Date(now - 30 * 86_400_000))))
      .orderBy(desc(checkoutLeads.updatedAt))
      .limit(100),
    db
      .select({
        started: sql<number>`count(*)`,
        finished: sql<number>`sum(case when ${checkoutLeads.orderId} is not null then 1 else 0 end)`,
      })
      .from(checkoutLeads)
      .where(gte(checkoutLeads.createdAt, week)),
  ]);
  const started = Number(summary?.started ?? 0);
  const finished = Number(summary?.finished ?? 0);

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl">ما كمّلوش</h1>
        <p className="mt-1 leading-7 text-muted">
          الحرفاء اللي كتبو نومروهم في فورم الطلب وما ضغطوش «تأكيد الطلب». كلّمهم: ساعات يكون عندهم سؤال ولا صار مشكل في التلفون. كي يكمّل الحريف الطلب، يتنحّى من هنا وحدو.
        </p>
      </header>

      <section aria-label="آخر 7 أيام" className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-sm text-muted">بداو الطلب (7 أيام)</p>
          <p className="mt-1 text-2xl font-bold tabular">{started}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-muted">كمّلو الطلب</p>
          <p className="mt-1 text-2xl font-bold tabular text-success">{finished}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-muted">ما كمّلوش</p>
          <p className="mt-1 text-2xl font-bold tabular text-danger">
            {started - finished}
            {started > 0 ? <span className="ms-2 text-base font-medium text-muted">({Math.round(((started - finished) / started) * 100)}%)</span> : null}
          </p>
        </div>
      </section>

      <nav aria-label="العرض" className="flex gap-1">
        {[
          { href: "/admin/abandoned", label: "يستنّاو مكالمة", active: !showHandled },
          { href: "/admin/abandoned?show=handled", label: "تعاملت معاهم", active: showHandled },
        ].map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium", tab.active ? "bg-ink text-paper" : "bg-paper hover:bg-line/60")}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {leads.length === 0 ? (
        <p className={cn(card, "text-center text-muted")}>{showHandled ? "ما فماش." : "ما فما حتى حريف ما كمّلش في آخر 30 يوم."}</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => {
            const typing = now - l.updatedAt.getTime() < ABANDONED_AFTER_MS;
            const name = `${l.firstName} ${l.lastName}`.trim() || "بلا اسم";
            const wa = `السلام عليكم${l.firstName ? ` ${l.firstName}` : ""}، معاك مشكاة. شفنا اللي بديت طلب ${l.items[0]?.name ?? "سبيلي"} في موقعنا وما كمّلتوش. نجمو نعاونوك؟`;
            return (
              <li key={l.id} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{name}</p>
                    <p className="flex items-center gap-1">
                      <span dir="ltr" className="font-semibold tabular">
                        {formatTunisianPhone(l.phone)}
                      </span>
                      <CopyButton value={l.phone} label="انسخ رقم الهاتف" />
                    </p>
                    <p className="text-sm text-muted">{[l.city, l.governorate].filter(Boolean).join("، ") || "الولاية ما تكتبتش"}</p>
                  </div>
                  <div className="text-end">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
                        typing ? "bg-[#fdeb9c] text-[#5c4700]" : "bg-[#f7b1b1] text-[#7a1616]",
                      )}
                    >
                      {typing ? "يعمّر توّا" : "ما كمّلش"}
                    </span>
                    <p className="mt-1 text-sm text-muted" title={formatDateTime(l.updatedAt)}>
                      {ago(l.updatedAt, now)}
                    </p>
                  </div>
                </div>
                {l.items.length ? (
                  <p className="mt-3 text-sm">
                    {l.items.map((i) => `${i.name} × ${i.quantity}`).join("، ")} · <b className="tabular">{formatTND(l.subtotal)}</b>
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:+216${l.phone}`} className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-ink px-3 text-sm font-medium hover:bg-ink hover:text-paper">
                    <Phone aria-hidden className="size-4" />
                    اتصال
                  </a>
                  <a
                    href={whatsappLink(l.phone, wa)}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[#1f8f4e] px-3 text-sm font-medium text-paper hover:bg-[#187540]"
                  >
                    <WhatsAppIcon className="size-4" />
                    واتساب
                  </a>
                  <form action={dismissLead}>
                    <input type="hidden" name="id" value={l.id} />
                    {showHandled ? <input type="hidden" name="undo" value="1" /> : null}
                    <button type="submit" className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] px-3 text-sm font-medium text-muted hover:bg-mist hover:text-ink">
                      {showHandled ? "رجّعو للقائمة" : "تعاملت معاه"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
