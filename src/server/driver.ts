import "server-only";
import { and, desc, eq, gte, inArray, lt, notInArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { driverLedger, drivers, orderItems, orders, orderStatusHistory } from "@/db/schema";
import { DRIVER_COOKIE, verifyDriverSession } from "@/lib/driver-session";

/** The signed-in, active driver, or null. Checks the database so a paused driver or a new code locks the phone out at once. */
export const getCurrentDriver = cache(async () => {
  const store = await cookies();
  const session = await verifyDriverSession(store.get(DRIVER_COOKIE)?.value);
  if (!session) return null;
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, session.driverId)).limit(1);
  if (!driver || !driver.active || !driver.accessCodeHash || driver.sessionVersion !== session.version) return null;
  return { id: driver.id, name: driver.name, phone: driver.phone };
});

export async function requireDriver() {
  const driver = await getCurrentDriver();
  if (!driver) redirect("/driver/login");
  return driver;
}

/** How a driver's marks show in the order history. */
export const driverLabel = (name: string) => `${name} (الموزّع)`;

/** A day filter on the order date (from the stats page periods): either bound may be open. */
export type DayRange = { start: Date | null; end: Date | null };

const inRange = (range: DayRange) =>
  and(range.start ? gte(orders.createdAt, range.start) : undefined, range.end ? lt(orders.createdAt, range.end) : undefined);

/**
 * Orders still with the driver: given to him and neither delivered nor cancelled. Newest order
 * first, like the dashboard's list; the postponed ones always at the bottom, nearest day first.
 */
export async function openDriverOrders(driverId: number, range: DayRange) {
  return withItems(
    await db
      .select()
      .from(orders)
      .where(and(eq(orders.driverId, driverId), notInArray(orders.status, ["delivered", "cancelled"]), inRange(range)))
      .orderBy(
        sql`case when ${orders.status} = 'postponed' then 1 else 0 end`,
        sql`case when ${orders.status} = 'postponed' then coalesce(${orders.postponedUntil}, '9999-12-31') end`,
        desc(orders.createdAt),
        desc(orders.id),
      ),
  );
}

/**
 * His delivered or cancelled orders (latest first). `canUndo`: he marked it himself in the last
 * day, so he can take a wrong tap back.
 */
export async function doneDriverOrders(driverId: number, driverName: string, range: DayRange) {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.driverId, driverId), inArray(orders.status, ["delivered", "cancelled"]), inRange(range)))
    .orderBy(desc(orders.updatedAt), desc(orders.id))
    .limit(60);
  if (rows.length === 0) return [];
  const marked = await db
    .selectDistinct({ orderId: orderStatusHistory.orderId })
    .from(orderStatusHistory)
    .where(
      and(
        eq(orderStatusHistory.adminName, driverLabel(driverName)),
        gte(orderStatusHistory.createdAt, new Date(Date.now() - 24 * 3_600_000)),
        inArray(
          orderStatusHistory.orderId,
          rows.map((r) => r.id),
        ),
      ),
    );
  return (await withItems(rows)).map((r) => ({ ...r, canUndo: marked.some((m) => m.orderId === r.id) }));
}

async function withItems<T extends { id: number }>(rows: T[]) {
  if (rows.length === 0) return [];
  const items = await db
    .select({ orderId: orderItems.orderId, name: orderItems.productName, quantity: orderItems.quantity })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.id),
      ),
    );
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.id) }));
}

/**
 * The account between the shop and a driver: boxes given, brought back, delivered (from his
 * delivered orders) and still with him; cash from his delivered orders, handed in, still with him,
 * split into the products' price (owed to the shop) and the delivery fees (his).
 */
export async function driverAccount(driverId: number) {
  const [ledger, [delivered]] = await Promise.all([
    db
      .select({ kind: driverLedger.kind, total: sql<number>`coalesce(sum(${driverLedger.amount}), 0)` })
      .from(driverLedger)
      .where(eq(driverLedger.driverId, driverId))
      .groupBy(driverLedger.kind),
    db
      .select({
        orders: sql<number>`count(distinct ${orders.id})`,
        boxes: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.driverId, driverId), eq(orders.status, "delivered"))),
  ]);
  const [{ cash, goods, delivery } = { cash: 0, goods: 0, delivery: 0 }] = await db
    .select({
      cash: sql<number>`coalesce(sum(${orders.total}), 0)`,
      goods: sql<number>`coalesce(sum(${orders.subtotal}), 0)`,
      delivery: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.driverId, driverId), eq(orders.status, "delivered")));
  const sum = (kind: string) => Number(ledger.find((l) => l.kind === kind)?.total ?? 0);
  const given = sum("boxesGiven");
  const returned = sum("boxesReturned");
  const deliveredBoxes = Number(delivered?.boxes ?? 0);
  const cashReceived = sum("cashReceived");
  const deliverySettled = sum("deliverySettled");
  return {
    given,
    returned,
    deliveredBoxes,
    deliveredOrders: Number(delivered?.orders ?? 0),
    withHim: given - returned - deliveredBoxes,
    cashCollected: Number(cash),
    cashReceived,
    /** Cash from his delivered orders not settled yet (both parts below). */
    cashWithHim: Number(cash) - cashReceived - deliverySettled,
    /** The products' price of his delivered orders, less what he handed in: what he owes the shop. */
    goodsOwed: Number(goods) - cashReceived,
    /** The delivery fees of his delivered orders not settled yet: the driver keeps them. */
    deliveryEarned: Number(delivery) - deliverySettled,
  };
}

