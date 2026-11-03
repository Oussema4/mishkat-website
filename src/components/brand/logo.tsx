import Image from "next/image";
import Link from "next/link";
import { fill } from "@/i18n/ar";
import { getDictionary, type Locale } from "@/i18n/config";
import { BRAND_IMAGES } from "@/lib/brand-images";
import { cn } from "@/lib/site";

/**
 * Official Mishkat wordmark (charte-graphique/assets). Charter rules: black on light
 * backgrounds, gold on dark ones, never gold on ivory; minimum 120px wide on screen.
 */
export function Logo({
  tone = "ink",
  className,
  href = "/",
  locale = "ar",
}: {
  tone?: "ink" | "gold";
  className?: string;
  href?: string | null;
  locale?: Locale;
}) {
  const t = getDictionary(locale);
  const asset = BRAND_IMAGES[tone === "ink" ? "mishkat-ink" : "mishkat-gold"];
  const img = (
    <Image
      src={asset.src}
      alt={t.brand.name}
      width={asset.width}
      height={asset.height}
      priority={tone === "ink"}
      quality={90}
      className={cn("h-auto w-[7.5rem] md:w-32", className)}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center rounded-sm" aria-label={fill(t.brand.homeLabel, { name: t.brand.name })}>
      {img}
    </Link>
  );
}
