import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "@/lib/session";

let dummyHash: Promise<string> | null = null;

/** Compares against a real hash, or a dummy one when the account doesn't exist (same timing either way). */
export async function verifyPassword(password: string, hash: string | undefined) {
  if (!hash) {
    dummyHash ??= bcrypt.hash("timing-equalizer", 12);
    await bcrypt.compare(password, await dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function startSession(admin: { id: number; sessionVersion: number }) {
  const token = await signSession({ adminId: admin.id, version: admin.sessionVersion });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Returns the signed-in, active admin or null. Checks the DB so disabled accounts are locked out at once. */
export const getCurrentAdmin = cache(async () => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);
  if (!admin || !admin.active || admin.sessionVersion !== session.version) return null;
  return { id: admin.id, name: admin.name, email: admin.email };
});

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
