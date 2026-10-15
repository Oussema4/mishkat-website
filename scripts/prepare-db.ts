/**
 * Runs before every build (see "build" in package.json), followed by the seed:
 *  1. applies database migrations (safe to repeat),
 *  2. creates the first dashboard account from INITIAL_ADMIN_* env vars,
 *     only when no account exists yet.
 * The seed then adds the initial catalogue if it is missing (never overwrites edits).
 *
 * On Vercel it refuses to build without a Turso database: a local SQLite file
 * there would be wiped on every deploy and orders would be lost.
 */
import "dotenv/config";
import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { databaseConfig } from "../src/db/config";
import { admins } from "../src/db/schema";

const config = databaseConfig();

if (process.env.VERCEL && config.url.startsWith("file:")) {
  console.error(
    "\n✗ No database configured.\n" +
      "  Add a Turso database to this Vercel project (Storage → Turso) or set DATABASE_URL and DATABASE_AUTH_TOKEN.\n" +
      "  See README.md, section 3.\n",
  );
  process.exit(1);
}

if (config.url.startsWith("file:")) mkdirSync("./data", { recursive: true });

const db = drizzle(createClient(config));
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ Database schema up to date");

const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
if (email && password) {
  const existing = await db.select({ id: admins.id }).from(admins).limit(1);
  if (existing.length === 0) {
    if (password.length < 10) {
      console.error("✗ INITIAL_ADMIN_PASSWORD must be at least 10 characters.");
      process.exit(1);
    }
    await db.insert(admins).values({
      name: process.env.INITIAL_ADMIN_NAME?.trim() || "مسؤول مشكاة",
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    console.log(`✓ First dashboard account created for ${email}`);
  }
}
