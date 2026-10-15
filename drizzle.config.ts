import "dotenv/config";
import { mkdirSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { databaseConfig } from "./src/db/config";

const { url, authToken } = databaseConfig();
if (url.startsWith("file:")) mkdirSync("./data", { recursive: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: { url, authToken },
});
