import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { settings } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { DEFAULT_SETTINGS, LOCALIZED_SETTING_KEYS, SETTING_KEYS, type StoreSettings } from "@/lib/settings-schema";

const getStoredSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.select().from(settings);
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if ((SETTING_KEYS as string[]).includes(row.key)) merged[row.key] = row.value;
  }
  return merged as StoreSettings;
});

/**
 * The store settings, with the customer-facing texts in the requested language. A French or
 * English text that was never written falls back to the Arabic one.
 */
export async function getSettings(locale: Locale = "ar"): Promise<StoreSettings> {
  const stored = await getStoredSettings();
  if (locale === "ar") return stored;
  const translated = stored.translations?.[locale] ?? {};
  const out: StoreSettings = { ...stored };
  for (const key of LOCALIZED_SETTING_KEYS) {
    const value = translated[key];
    const empty = value === undefined || (typeof value === "string" ? !value.trim() : value.length === 0);
    // An Arabic policy left empty stays empty in every language ("being updated" notice).
    if (!empty && (key === "faq" || stored[key])) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export async function saveSettings(patch: Partial<StoreSettings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(SETTING_KEYS as string[]).includes(key) || value === undefined) continue;
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
}
