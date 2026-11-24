"use server";

/**
 * Driver app actions. Each one re-checks the driver's session and that the order is his:
 * server actions are public endpoints.
 */
import { and, desc, eq, gte, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { drivers, ORDER_STATUSES, orders, orderStatusHistory, type OrderStatus } from "@/db/schema";
import { DRIVER_COOKIE, driverCookieOptions, hashDriverCode, signDriverSession } from "@/lib/driver-session";
import { changeOrderStatus } from "@/server/order-core";
import { clientIp, hit } from "@/server/rate-limit";
import { driverLabel, requireDriver } from "@/server/driver";

export type DriverLoginState = { error?: string };

export async function driverLogin(_prev: DriverLoginState, form: FormData): Promise<DriverLoginState> {
  const code = String(form.get("code") ?? "").slice(0, 40);
  // A code is about 40 bits: a few wrong tries per hour from one connection is all it gets.
  const { allowed } = await hit(db, { key: `driver-login:${clientIp(await headers())}`, max: 8, windowMs: 60 * 60 * 1000 });
  if (!allowed) return { error: "جرّبت برشا مرّات. استنّى ساعة وعاود، ولا اطلب كود جديد من المتجر." };
  if (code.replace(/[^0-9a-z]/gi, "").length !== 8) return { error: "الكود فيه 8 حروف وأرقام، كيما K7P2-9XQM." };
  const [driver] = await db
    .select({ id: drivers.id, active: drivers.active, version: drivers.sessionVersion })
    .from(drivers)
    .where(eq(drivers.accessCodeHash, hashDriverCode(code)))
    .limit(1);
  if (!driver || !driver.active) return { error: "الكود موش صحيح. ثبّت فيه ولا اطلب كود جديد من المتجر." };
  const store = await cookies();
  store.set(DRIVER_COOKIE, await signDriverSession(driver.id, driver.version), driverCookieOptions);
  redirect("/driver");
}

export async function driverLogout() {
  const store = await cookies();
  store.delete(DRIVER_COOKIE);
  redirect("/driver/login");
}

export type MarkState = { error?: string };

/** One of the three marks on an order still with the driver. */
export async function markOrder(_prev: MarkState, form: FormData): Promise<MarkState> {
  const driver = await requireDriver();
  const orderId = Number(form.get("orderId"));
  const mark = String(form.get("mark"));
  if (!Number.isInteger(orderId) || orderId <= 0 || !["delivered", "noAnswer", "cancelled"].includes(mark)) return { error: "صار مشكل، عاود جرّب." };
  const [order] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.driverId, driver.id), notInArray(orders.status, ["delivered", "cancelled"])))
    .limit(1);
  if (!order) return { error: "الطلب هذا ما عادش عندك. حدّث الصفحة." };

  if (mark === "noAnswer") {
    await db
      .update(orders)
      .set({ noAnswerCount: sql`${orders.noAnswerCount} + 1`, noAnswerAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  } else {
    const result = await changeOrderStatus(db, order.id, mark as "delivered" | "cancelled", { id: null, name: driverLabel(driver.name) });
    if (!result.ok) return { error: result.message };
  }
  revalidatePath("/driver");
  revalidatePath("/admin", "layout");
  revalidatePath("/[lang]", "layout");
  return {};
}

/** Takes back a "delivered" or "cancelled" the driver tapped by mistake (his own, in the last day). */
export async function undoMark(form: FormData) {
  const driver = await requireDriver();
  const orderId = Number(form.get("orderId"));
  if (!Number.isInteger(orderId) || orderId <= 0) return;
  const [order] = await db.select({ id: orders.id, status: orders.status, driverId: orders.driverId }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.driverId !== driver.id) return;
  const [last] = await db
    .select({ fromStatus: orderStatusHistory.fromStatus, toStatus: orderStatusHistory.toStatus, adminName: orderStatusHistory.adminName })
    .from(orderStatusHistory)
    .where(and(eq(orderStatusHistory.orderId, order.id), gte(orderStatusHistory.createdAt, new Date(Date.now() - 24 * 3_600_000))))
    .orderBy(desc(orderStatusHistory.id))
    .limit(1);
  const back = last?.fromStatus as OrderStatus | null | undefined;
  if (!last || last.adminName !== driverLabel(driver.name) || last.toStatus !== order.status || !back || !ORDER_STATUSES.includes(back)) return;
  await changeOrderStatus(db, order.id, back, { id: null, name: driverLabel(driver.name) });
  revalidatePath("/driver");
  revalidatePath("/admin", "layout");
  revalidatePath("/[lang]", "layout");
}
