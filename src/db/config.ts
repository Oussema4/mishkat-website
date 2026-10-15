import type { Client } from "@libsql/client";

/**
 * Local development uses a SQLite file; production uses Turso (libSQL) via env vars.
 * Accepts our own names and the ones set by Vercel's Turso integration.
 */
export function databaseConfig() {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "file:./data/mishkat.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;
  return { url, authToken };
}

/**
 * Local SQLite files only (Turso is configured server-side). No busy_timeout on purpose:
 * the local driver is synchronous, so waiting on a lock would block the whole server.
 * Lock contention is handled by async retries in order-core instead.
 */
export async function tuneLocalDatabase(client: Client, url: string) {
  if (!url.startsWith("file:")) return;
  await client.execute("PRAGMA journal_mode = WAL");
  await client.execute("PRAGMA foreign_keys = ON");
}
