import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    // Outside the store layout, so it takes the store's black-and-gold theme itself.
    <div className="night on-dark min-h-dvh bg-ink text-paper">
      <main className="container-page flex min-h-dvh flex-col items-start justify-center gap-6 py-16">
        <Logo tone="gold" />
        <h1 className="text-4xl md:text-5xl">الصفحة غير موجودة</h1>
        <p className="max-w-md text-lg text-muted">ربما تغيّر الرابط أو حُذفت الصفحة. يمكنك العودة إلى المتجر ومتابعة التسوّق.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/shop" className={buttonClass("primary")}>
            تصفّح المتجر
          </Link>
          <Link href="/" className={buttonClass("outline")}>
            الصفحة الرئيسية
          </Link>
        </div>
      </main>
    </div>
  );
}
