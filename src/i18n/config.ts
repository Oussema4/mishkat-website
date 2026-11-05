/**
 * The store's languages. Arabic is served at the site root (/shop), the others under their prefix
 * (/fr/shop, /en/shop): next.config.ts rewrites root URLs to /ar/… internally.
 * Every language has a full dictionary with the same keys (ar.ts is the reference).
 */
import { ar, type Dictionary } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export const LOCALES = ["ar", "fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const defaultLocale: Locale = "ar";

export const LOCALE_INFO: Record<Locale, { dir: "rtl" | "ltr"; htmlLang: string; ogLocale: string; label: string; flag: "tn" | "fr" | "us" }> = {
  ar: { dir: "rtl", htmlLang: "ar-TN", ogLocale: "ar_TN", label: "العربية", flag: "tn" },
  fr: { dir: "ltr", htmlLang: "fr-TN", ogLocale: "fr_FR", label: "Français", flag: "fr" },
  en: { dir: "ltr", htmlLang: "en", ogLocale: "en_US", label: "English", flag: "us" },
};

const dictionaries: Record<Locale, Dictionary> = { ar, fr, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

/** "/shop" in this language: unchanged for Arabic, "/fr/shop" for French. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Splits a browser path into its language and the path without the prefix. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  // "/ar/…" too: while rendering an Arabic page the server sees the internal (rewritten) address.
  if (isLocale(first)) return { locale: first, path: `/${rest.join("/")}` };
  return { locale: defaultLocale, path: pathname || "/" };
}

/** hreflang alternates for a page path, for metadata and the sitemap. */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].htmlLang, localePath(l, path)])),
    "x-default": localePath(defaultLocale, path),
  };
}
