import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getCurrentDriver } from "@/server/driver";
import { DriverLoginForm } from "./login-form";

export const metadata: Metadata = { title: "الدخول" };

export default async function DriverLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await getCurrentDriver()) redirect("/driver");
  const { code } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-paper p-8 shadow-[var(--shadow-soft)]">
        <Logo href={null} className="w-32" />
        <h1 className="mt-6 text-2xl">موزّع مشكاة</h1>
        <p className="mt-1 leading-7 text-muted">اكتب الكود اللي عطاهولك المتجر. تكتبو مرّة وحدة برك، والتليفون يتفكّرك.</p>
        <DriverLoginForm code={typeof code === "string" ? code.slice(0, 12) : ""} />
      </div>
    </main>
  );
}
