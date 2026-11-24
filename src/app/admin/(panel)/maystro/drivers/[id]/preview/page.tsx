import { eq } from "drizzle-orm";
import { ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { DriverScreen, type SearchParams } from "@/app/driver/driver-screen";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "شاشة الموزّع" };

/**
 * The driver app exactly as this driver sees it (his real orders and account), inside a phone-sized
 * frame. Nothing can be changed from here: the buttons only say it's a preview.
 */
export default async function DriverPreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [driver] = await db.select({ id: drivers.id, name: drivers.name }).from(drivers).where(eq(drivers.id, id)).limit(1);
  if (!driver) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/admin/maystro/drivers/${driver.id}`} className="inline-flex min-h-10 items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowRight aria-hidden className="size-4" />
        حساب {driver.name}
      </Link>
      <p className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[#bfd3f5] px-4 py-3 text-sm font-medium text-[#173777]">
        <Eye aria-hidden className="size-4 shrink-0" />
        هكا يشوف {driver.name} التطبيق توّا. هذا عرض برك: الفلايس ما يخدموش هوني، ما يتبدّل حتى شي.
      </p>
      <div className="mx-auto w-full max-w-[24rem] overflow-hidden rounded-[2rem] border-8 border-ink bg-mist shadow-[var(--shadow-soft)]">
        <DriverScreen driver={driver} params={await searchParams} base={`/admin/maystro/drivers/${driver.id}/preview`} preview />
      </div>
    </div>
  );
}
