import type { MetadataRoute } from "next";
import { LOCALE_INFO, LOCALES, localePath } from "@/i18n/config";
import { siteUrl } from "@/lib/site";
import { getActiveProducts } from "@/server/catalog";

/** Every store page in each language, each entry pointing to its versions in the other languages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getActiveProducts();
  const pages: { path: string; priority: number; lastModified?: Date }[] = [
    { path: "/", priority: 1 },
    { path: "/shop", priority: 0.6 },
    { path: "/faq", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/policies/delivery", priority: 0.6 },
    { path: "/policies/returns", priority: 0.6 },
    ...products.map((p) => ({ path: `/products/${p.slug}`, priority: 0.9, lastModified: p.updatedAt })),
  ];
  const url = (locale: (typeof LOCALES)[number], path: string) => `${base}${localePath(locale, path)}`.replace(/\/$/, "") || base;
  const entries: MetadataRoute.Sitemap = pages.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: url(locale, page.path),
      ...(page.lastModified ? { lastModified: page.lastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: page.priority,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].htmlLang, url(l, page.path)])) },
    })),
  );
  // The illustrated rules (Arabic only), a static page in public/rules.
  entries.push({ url: `${base}/rules/sabili`, changeFrequency: "monthly", priority: 0.5 });
  return entries;
}
