/**
 * Locale setup. Arabic is the only language today; to add French later, create
 * `fr.ts` with the same keys as `ar.ts`, add it below, and route by locale.
 */
import { ar } from "./ar";

export const locales = { ar: { dir: "rtl", lang: "ar-TN", dict: ar } } as const;
export type Locale = keyof typeof locales;
export const defaultLocale: Locale = "ar";

export function getDictionary(locale: Locale = defaultLocale) {
  return locales[locale].dict;
}

export const t = getDictionary();
