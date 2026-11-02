import { CircleCheck, CircleX } from "lucide-react";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { getCurrentOwner, requireAdmin } from "@/server/auth";
import { checkConnection, maystroEnabled, maystroWebhookUrl } from "@/server/maystro";
import { WebhookForm } from "./webhook-form";

export const metadata = { title: "Maystro" };

export default async function MaystroPage() {
  // Every admin page re-checks the session against the database: the layout does not re-run on
  // client-side navigation, so a disabled or signed-out admin must be stopped here too.
  await requireAdmin();
  const owner = await getCurrentOwner();
  const enabled = maystroEnabled();
  const [checks, [{ failed }], active] = await Promise.all([
    enabled ? checkConnection() : Promise.resolve([]),
    db.select({ failed: count() }).from(orders).where(eq(orders.maystroState, "failed")),
    db.select({ name: products.name, maystroProductId: products.maystroProductId }).from(products).where(eq(products.status, "active")),
  ]);
  const missing = active.filter((p) => !p.maystroProductId).map((p) => p.name);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl">التوصيل عبر Maystro</h1>
        <p className="mt-1 text-muted">في صفحة كل طلب تختار طريقة التوصيل. إذا اخترت Maystro يُرسل الطرد إليهم، وحالته تتحدّث وحدها.</p>
      </header>

      <section className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-sans text-lg font-bold">الاتصال</h2>
        {!enabled ? (
          <p className="mt-3 leading-7">
            غير مربوط. أضف المتغيّر <code dir="ltr">MAYSTRO_TOKEN</code> في Vercel (Settings ← Environment Variables، نوع Secret، بيئة Production) بقيمة
            «Authentication token» من حسابك في Maystro، ثم أعد النشر.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                {c.ok ? <CircleCheck aria-hidden className="size-5 text-success" /> : <CircleX aria-hidden className="size-5 text-danger" />}
                <span>{c.label}</span>
                <span className="text-sm text-muted">{c.ok ? "يعمل" : `لا يعمل${c.detail ? ` (${c.detail})` : ""}`}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-sans text-lg font-bold">المنتجات</h2>
        {active.length === 0 ? (
          <p className="mt-3 text-muted">لا توجد منتجات ظاهرة.</p>
        ) : missing.length === 0 ? (
          <p className="mt-3">كل المنتجات الظاهرة مربوطة بمنتج في Maystro.</p>
        ) : (
          <p className="mt-3 leading-7 text-danger">
            غير مربوطة: {missing.join("، ")}. افتح المنتج واختر «المنتج في Maystro»، وإلا لن تُرسل طلباته.
          </p>
        )}
        {failed > 0 ? <p className="mt-2 text-danger">{failed} طلبات لم تُرسل إلى Maystro: افتحها من قائمة الطلبات وأعد الإرسال.</p> : null}
      </section>

      <section className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-sans text-lg font-bold">تحديث الحالات تلقائيًا (webhook)</h2>
        <p className="mt-2 leading-7 text-muted">
          يجعل Maystro يعلم المتجر كلما تغيّرت حالة طرد (مع الموزّع، تم التسليم…). الرابط سرّي: لا ترسله لأحد.
        </p>
        {enabled && owner ? (
          <>
            <p dir="ltr" className="mt-3 break-all rounded-[var(--radius-md)] bg-mist p-3 text-start font-mono text-sm">
              {maystroWebhookUrl()}
            </p>
            <WebhookForm />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">{enabled ? "التسجيل للمالك فقط." : "اربط Maystro أولًا."}</p>
        )}
      </section>
    </div>
  );
}
