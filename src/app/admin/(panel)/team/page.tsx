import { asc } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { formatDateTime } from "@/lib/dates";
import { requireAdmin } from "@/server/auth";
import { setAdminActive } from "../../actions";
import { NewAdminForm, PasswordForm } from "./team-forms";

export const metadata = { title: "المسؤولون" };

export default async function TeamPage() {
  const me = await requireAdmin();
  // Only an owner manages accounts (the actions enforce it too; this only hides the controls).
  const isOwner = me.role === "owner";
  const rows = await db
    .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role, active: admins.active, lastLoginAt: admins.lastLoginAt })
    .from(admins)
    .orderBy(asc(admins.id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">المسؤولون</h1>

      <section className="overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-soft)]">
        <ul className="divide-y divide-line">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">
                  {a.name} {a.id === me.id ? <span className="text-sm font-normal text-muted">(أنت)</span> : null}{" "}
                  <span className="text-sm font-normal text-muted">· {a.role === "owner" ? "مالك" : "مسؤول"}</span>
                </p>
                <p dir="ltr" className="text-end text-sm text-muted">
                  {a.email}
                </p>
                <p className="text-xs text-muted">آخر دخول: {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "لم يدخل بعد"}</p>
              </div>
              {isOwner && a.id !== me.id ? (
                <form action={setAdminActive}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="active" value={a.active ? "0" : "1"} />
                  <button
                    type="submit"
                    className={
                      a.active
                        ? "min-h-10 rounded-md px-3 text-sm font-medium text-danger hover:bg-danger-bg"
                        : "min-h-10 rounded-md px-3 text-sm font-medium text-success hover:bg-success-bg"
                    }
                  >
                    {a.active ? "إيقاف الحساب" : "تفعيل الحساب"}
                  </button>
                </form>
              ) : a.active ? (
                <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-sm text-success">نشط</span>
              ) : (
                <span className="rounded-full bg-mist px-2.5 py-0.5 text-sm text-muted">موقوف</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {isOwner ? (
          <NewAdminForm />
        ) : (
          <p className="rounded-[var(--radius-lg)] bg-paper p-6 text-muted shadow-[var(--shadow-soft)]">إضافة الحسابات وإيقافها للمالك فقط.</p>
        )}
        <PasswordForm />
      </div>
    </div>
  );
}
