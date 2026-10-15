import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getCurrentAdmin } from "@/server/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "دخول لوحة التحكم", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-mist px-4 py-12">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-paper p-8 shadow-[var(--shadow-soft)]">
        <Logo href={null} className="w-32" />
        <h1 className="mt-6 text-2xl">لوحة التحكم</h1>
        <p className="mt-1 text-muted">سجّل الدخول لإدارة الطلبات والمنتجات.</p>
        <LoginForm />
      </div>
    </main>
  );
}
