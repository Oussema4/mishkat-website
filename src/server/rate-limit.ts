/**
 * Fixed-window rate limits kept in the database, so every server instance shares the same counters
 * (an in-memory Map is per instance on Vercel and is lost whenever an instance is recycled).
 * Takes the database as a parameter so it can be tested against an in-memory database.
 */
import { and, eq, gt, lt, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { rateLimits } from "@/db/schema";

type Database = LibSQLDatabase<typeof schema>;

export type Limit = { key: string; max: number; windowMs: number };

/** Counts one hit atomically and says whether it is still within the limit. */
export async function hit(db: Database, { key, max, windowMs }: Limit, now = Date.now()) {
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: now + windowMs })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${now + windowMs} else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });
  // Now and then, drop windows that ended over a day ago so the table stays small.
  if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, now - 86_400_000));
  return { allowed: row.count <= max, retryAfterMs: Math.max(0, row.resetAt - now) };
}

/** True when the key has already used up its limit in the current window (does not count a hit). */
export async function isBlocked(db: Database, { key, max }: Pick<Limit, "key" | "max">, now = Date.now()) {
  const [row] = await db
    .select({ count: rateLimits.count })
    .from(rateLimits)
    .where(and(eq(rateLimits.key, key), gt(rateLimits.resetAt, now)))
    .limit(1);
  return Boolean(row && row.count >= max);
}

/** Forgets a key (e.g. an account's failed logins after a successful sign-in). */
export async function reset(db: Database, key: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}

/** The client's IP as Vercel reports it (Vercel overwrites these headers, so they can't be spoofed there). */
export function clientIp(h: { get(name: string): string | null }) {
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
