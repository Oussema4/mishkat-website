import Image from "next/image";
import Link from "next/link";
import { t } from "@/i18n/config";
import { cn } from "@/lib/site";

/** Mishkat wordmark, recolored from the original gold logo (see scripts/prepare-assets.mjs). */
export function Logo({ tone = "ink", className, href = "/" }: { tone?: "ink" | "gold"; className?: string; href?: string | null }) {
  const img = (
    <Image
      src={tone === "ink" ? "/images/brand/mishkat-ink.png" : "/images/brand/mishkat-gold.png"}
      alt={t.brand.name}
      width={640}
      height={178}
      priority={tone === "ink"}
      className={cn("h-auto w-28 md:w-32", className)}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} className="inline-flex min-h-11 shrink-0 items-center rounded-sm" aria-label={`${t.brand.name}، الصفحة الرئيسية`}>
      {img}
    </Link>
  );
}
