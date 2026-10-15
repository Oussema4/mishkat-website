import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_SETTINGS, SETTING_KEYS, type StoreSettings } from "@/lib/settings-schema";

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.select().from(settings);
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if ((SETTING_KEYS as string[]).includes(row.key)) merged[row.key] = row.value;
  }
  return merged as StoreSettings;
});

export async function saveSettings(patch: Partial<StoreSettings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(SETTING_KEYS as string[]).includes(key) || value === undefined) continue;
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
}
