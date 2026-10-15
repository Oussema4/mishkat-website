import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/toast";
import { requireAdmin } from "@/server/auth";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة تحكم مشكاة" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh bg-sand lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-e">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Logo href="/admin" className="w-24" />
          <p className="hidden text-sm text-muted lg:mt-2 lg:block">لوحة التحكم</p>
        </div>
        <AdminNav />
        <div className="hidden border-t border-line px-5 py-4 lg:mt-auto lg:block">
          <p className="truncate text-sm font-semibold">{admin.name}</p>
          <p dir="ltr" className="truncate text-end text-xs text-muted">
            {admin.email}
          </p>
          <form action={logout} className="mt-3">
            <button type="submit" className="min-h-10 text-sm font-medium text-danger hover:underline">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        {children}
        <form action={logout} className="mt-10 border-t border-line pt-4 lg:hidden">
          <span className="text-sm text-muted">{admin.name} · </span>
          <button type="submit" className="min-h-10 text-sm font-medium text-danger hover:underline">
            تسجيل الخروج
          </button>
        </form>
      </main>
      <Toaster />
    </div>
  );
}
