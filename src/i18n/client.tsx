"use client";

import { createContext, useContext } from "react";
import { getDictionary, localePath, type Locale } from "./config";

const LocaleContext = createContext<Locale>("ar");

/** Gives client components the page's language (set once by the store layout). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** The current language, its dictionary, and a helper for links in that language. */
export function useI18n() {
  const locale = useContext(LocaleContext);
  return { locale, t: getDictionary(locale), href: (path: string) => localePath(locale, path) };
}
