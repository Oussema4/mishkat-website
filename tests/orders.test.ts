import os from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { tuneLocalDatabase } from "@/db/config";
import * as schema from "@/db/schema";
import { changeOrderStatus, createOrder } from "@/server/order-core";
import { checkoutSchema, type CheckoutData } from "@/lib/validation";

type DB = ReturnType<typeof drizzle<typeof schema>>;
let db: DB;
let productId: number;

const admin = { id: null, name: "اختبار" };

function input(overrides: Partial<CheckoutData> = {}): CheckoutData {
  return checkoutSchema.parse({
    firstName: "أحمد",
    lastName: "التونسي",
    phone: "+216 92 123 456",
    governorate: "سوسة",
    city: "حمام سوسة",
    address: "نهج الياسمين عدد 4",
    items: [{ productId, quantity: 2 }],
    idempotencyKey: `key-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    ...overrides,
  });
}

async function stock() {
  const [p] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  return p.stock;
}

beforeEach(async () => {
  // A real file database (in-memory SQLite can't run concurrent transactions like production does).
  const file = path.join(os.tmpdir(), `mishkat-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  const client = createClient({ url: `file:${file}` });
  await tuneLocalDatabase(client, `file:${file}`);
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  const [p] = await db
    .insert(schema.products)
    .values({ slug: "sabili", name: "سبيلي", price: 48000, compareAtPrice: 59000, stock: 5 })
    .returning();
  productId = p.id;
});

describe("createOrder", () => {
  it("saves the order with server-side prices, delivery fee and reference", async () => {
    const result = await createOrder(db, input(), 8000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reference).toBe("MSK-000001");

    const [order] = await db.select().from(schema.orders);
    expect(order.subtotal).toBe(96000);
    expect(order.deliveryFee).toBe(8000);
    expect(order.total).toBe(104000);
    expect(order.paymentMethod).toBe("cod");
    expect(order.phone).toBe("92123456");
    expect(order.status).toBe("new");

    const items = await db.select().from(schema.orderItems);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productName: "سبيلي", unitPrice: 48000, quantity: 2, lineTotal: 96000 });
    expect(await stock()).toBe(3);
  });

  it("never creates two orders for the same checkout (double submit)", async () => {
    const data = input();
    const [a, b] = await Promise.all([createOrder(db, data, 8000), createOrder(db, data, 8000)]);
    const c = await createOrder(db, data, 8000);
    expect(a.ok && b.ok && c.ok).toBe(true);
    const orders = await db.select().from(schema.orders);
    expect(orders).toHaveLength(1);
    expect(await stock()).toBe(3);
  });

  it("refuses orders beyond available stock and leaves stock untouched", async () => {
    const result = await createOrder(db, input({ items: [{ productId, quantity: 6 }] }), 8000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("stock");
    expect(await db.select().from(schema.orders)).toHaveLength(0);
    expect(await stock()).toBe(5);
  });

  it("refuses hidden products", async () => {
    await db.update(schema.products).set({ status: "hidden" }).where(eq(schema.products.id, productId));
    const result = await createOrder(db, input(), 8000);
    expect(result.ok).toBe(false);
  });
});

describe("changeOrderStatus", () => {
  it("returns stock on cancellation and takes it again when re-opened", async () => {
    await createOrder(db, input(), 8000);
    const [order] = await db.select().from(schema.orders);
    expect(await stock()).toBe(3);

    expect((await changeOrderStatus(db, order.id, "cancelled", admin)).ok).toBe(true);
    expect(await stock()).toBe(5);

    // Cancelling twice must not add stock twice.
    await changeOrderStatus(db, order.id, "cancelled", admin);
    expect(await stock()).toBe(5);

    expect((await changeOrderStatus(db, order.id, "confirmed", admin)).ok).toBe(true);
    expect(await stock()).toBe(3);

    const history = await db.select().from(schema.orderStatusHistory).where(eq(schema.orderStatusHistory.orderId, order.id));
    expect(history.map((h) => h.toStatus)).toEqual(["new", "cancelled", "confirmed"]);
  });
});
