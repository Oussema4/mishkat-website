import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { databaseConfig, tuneLocalDatabase } from "./config";

const globalForDb = globalThis as unknown as { __mishkatDb?: ReturnType<typeof create> };

function create() {
  const config = databaseConfig();
  const client = createClient(config);
  // WAL mode persists in the file once set, so a busy database here (parallel build workers) is harmless.
  void tuneLocalDatabase(client, config.url).catch((err) => {
    if (!/SQLITE_BUSY|database is locked/i.test(String(err?.message ?? err))) console.error("SQLite tuning failed", err);
  });
  return drizzle(client, { schema });
}

/** Single shared connection (reused across hot reloads in development). */
export const db = globalForDb.__mishkatDb ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__mishkatDb = db;

export type DB = typeof db;
export { schema };
