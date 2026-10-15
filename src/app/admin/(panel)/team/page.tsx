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
  const rows = await db
    .select({ id: admins.id, name: admins.name, email: admins.email, active: admins.active, lastLoginAt: admins.lastLoginAt })
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
                  {a.name} {a.id === me.id ? <span className="text-sm font-normal text-muted">(أنت)</span> : null}
                </p>
                <p dir="ltr" className="text-end text-sm text-muted">
                  {a.email}
                </p>
                <p className="text-xs text-muted">آخر دخول: {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "لم يدخل بعد"}</p>
              </div>
              {a.id !== me.id ? (
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
              ) : (
                <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-sm text-success">نشط</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <NewAdminForm />
        <PasswordForm />
      </div>
    </div>
  );
}
