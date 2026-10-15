/**
 * Creates (or resets the password of) a dashboard account.
 * Usage: npm run admin:create -- "الاسم" email@example.com "كلمة-سر-قوية"
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { databaseConfig } from "../src/db/config";
import { admins } from "../src/db/schema";

const [name, rawEmail, password] = process.argv.slice(2);
if (!name || !rawEmail || !password) {
  console.error('الاستعمال: npm run admin:create -- "الاسم" email@example.com "كلمة السر"');
  process.exit(1);
}
if (password.length < 10) {
  console.error("كلمة السر يجب أن تكون 10 أحرف على الأقل");
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const db = drizzle(createClient(databaseConfig()));
const passwordHash = await bcrypt.hash(password, 12);
const [existing] = await db.select().from(admins).where(eq(admins.email, email));

if (existing) {
  await db
    .update(admins)
    .set({ name, passwordHash, active: true, sessionVersion: sql`${admins.sessionVersion} + 1`, updatedAt: new Date() })
    .where(eq(admins.id, existing.id));
  console.log(`✓ تم تحديث الحساب ${email}`);
} else {
  await db.insert(admins).values({ name, email, passwordHash });
  console.log(`✓ تم إنشاء الحساب ${email}`);
}
