import os from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { tuneLocalDatabase } from "@/db/config";
import * as schema from "@/db/schema";
import { changeOrderStatus, createOrder, MAX_OPEN_ORDERS_PER_PHONE } from "@/server/order-core";
import { hit, isBlocked, reset } from "@/server/rate-limit";
import { checkoutSchema, MAX_ITEMS_PER_ORDER, type CheckoutData } from "@/lib/validation";

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

describe("abuse limits", () => {
  it("caps open orders per phone number, and frees a slot when one is cancelled", async () => {
    const one = { items: [{ productId, quantity: 1 }] };
    for (let i = 0; i < MAX_OPEN_ORDERS_PER_PHONE; i++) {
      expect((await createOrder(db, input(one), 8000)).ok).toBe(true);
    }
    const blocked = await createOrder(db, input(one), 8000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe("limit");
    // The refused order took no stock.
    expect(await stock()).toBe(5 - MAX_OPEN_ORDERS_PER_PHONE);

    // Another number is not affected.
    expect((await createOrder(db, input({ ...one, phone: "98765432" }), 8000)).ok).toBe(true);

    const [first] = await db.select().from(schema.orders).where(eq(schema.orders.phone, "92123456")).limit(1);
    await changeOrderStatus(db, first.id, "cancelled", admin);
    expect((await createOrder(db, input(one), 8000)).ok).toBe(true);
  });

  it("does not hand an order's secret link to a different phone using the same key", async () => {
    const data = input();
    const first = await createOrder(db, data, 8000);
    expect(first.ok).toBe(true);
    const other = await createOrder(db, { ...data, phone: "98765432" }, 8000);
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.code).toBe("conflict");
    expect("publicToken" in other).toBe(false);
    expect(await db.select().from(schema.orders)).toHaveLength(1);
  });

  it("refuses more than the maximum number of pieces in one order", () => {
    const parsed = checkoutSchema.safeParse({
      ...input(),
      phone: "92123456",
      items: [{ productId, quantity: MAX_ITEMS_PER_ORDER }, { productId: productId + 1, quantity: 1 }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("database rate limits", () => {
  const limit = { key: "test:ip:1.2.3.4", max: 2, windowMs: 60_000 };

  it("allows up to the limit, blocks after it, and starts over when the window ends", async () => {
    const t = 1_000_000;
    expect((await hit(db, limit, t)).allowed).toBe(true);
    expect(await isBlocked(db, limit, t)).toBe(false);
    expect((await hit(db, limit, t + 1)).allowed).toBe(true);
    expect(await isBlocked(db, limit, t + 2)).toBe(true);
    expect((await hit(db, limit, t + 3)).allowed).toBe(false);

    // Window over: counting starts again.
    expect(await isBlocked(db, limit, t + 60_001)).toBe(false);
    expect((await hit(db, limit, t + 60_001)).allowed).toBe(true);
  });

  it("counts concurrent hits exactly (shared across server instances)", async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => hit(db, { ...limit, key: "test:burst" })));
    expect(results.filter((r) => r.allowed)).toHaveLength(2);
  });

  it("reset clears a key", async () => {
    await hit(db, limit);
    await hit(db, limit);
    await reset(db, limit.key);
    expect(await isBlocked(db, limit)).toBe(false);
  });
});
