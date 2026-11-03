import type { Metadata } from "next";
import { getDictionary, isLocale, languageAlternates, localePath, type Locale } from "./config";

export type LangParams = { params: Promise<{ lang: string }> };

/** The page's language from its route ([lang] is validated by the layout; Arabic as a fallback). */
export async function pageLocale(params: Promise<{ lang: string }>) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "ar";
  return { locale, t: getDictionary(locale), href: (path: string) => localePath(locale, path) };
}

/** Canonical URL of this page in this language, plus its versions in the other languages. */
export function pageAlternates(locale: Locale, path: string): Metadata["alternates"] {
  return { canonical: localePath(locale, path), languages: languageAlternates(path) };
}
