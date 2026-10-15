/** Applies pending database migrations from ./drizzle. Run: npm run db:migrate */
import "dotenv/config";
import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { databaseConfig } from "../src/db/config";

const config = databaseConfig();
if (config.url.startsWith("file:")) mkdirSync("./data", { recursive: true });

const db = drizzle(createClient(config));
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ قاعدة البيانات محدّثة");
