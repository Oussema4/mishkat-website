/**
 * Order business logic. Takes the database as a parameter so it can be tested
 * against an in-memory database (see tests/orders.test.ts).
 */
import { randomBytes } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { orderItems, orders, orderStatusHistory, products, type OrderStatus } from "@/db/schema";
import { computeTotals } from "@/lib/pricing";
import type { CheckoutData } from "@/lib/validation";

type Database = LibSQLDatabase<typeof schema>;

export type CreateOrderResult =
  | { ok: true; publicToken: string; reference: string; duplicate: boolean }
  | { ok: false; code: "unavailable" | "stock"; message: string };

class OrderError extends Error {
  constructor(
    public code: "unavailable" | "stock",
    message: string,
  ) {
    super(message);
  }
}

export function formatReference(id: number) {
  return `MSK-${String(id).padStart(6, "0")}`;
}

function errorText(err: unknown) {
  const e = err as { message?: string; code?: string; cause?: { message?: string; code?: string } };
  return [e?.message, e?.code, e?.cause?.message, e?.cause?.code, String(err)].filter(Boolean).join(" ");
}

function isUniqueViolation(err: unknown) {
  return /UNIQUE constraint failed/i.test(errorText(err));
}

function isBusy(err: unknown) {
  return /SQLITE_BUSY|database is locked|TRANSACTION_ACTIVE/i.test(errorText(err));
}

/** Retries a write transaction a few times when the database is momentarily locked. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 8): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts || !isBusy(err)) throw err;
      await new Promise((r) => setTimeout(r, 40 * i + Math.random() * 60));
    }
  }
}

async function findByIdempotencyKey(db: Database, key: string) {
  const [existing] = await db
    .select({ publicToken: orders.publicToken, reference: orders.reference })
    .from(orders)
    .where(eq(orders.idempotencyKey, key))
    .limit(1);
  return existing;
}

export async function createOrder(db: Database, data: CheckoutData, deliveryFee: number): Promise<CreateOrderResult> {
  // Same checkout submitted twice (double click, retry after timeout) → same order.
  const existing = await findByIdempotencyKey(db, data.idempotencyKey);
  if (existing) return { ok: true, ...existing, duplicate: true };

  // Merge duplicate lines for the same product.
  const qtyById = new Map<number, number>();
  for (const item of data.items) qtyById.set(item.productId, (qtyById.get(item.productId) ?? 0) + item.quantity);

  try {
    const result = await withRetry(() => db.transaction(async (tx) => {
      // A concurrent identical submit may have committed while we waited for the lock.
      const [already] = await tx
        .select({ publicToken: orders.publicToken, reference: orders.reference })
        .from(orders)
        .where(eq(orders.idempotencyKey, data.idempotencyKey))
        .limit(1);
      if (already) return { ...already, duplicate: true };

      const ids = [...qtyById.keys()];
      const rows = await tx.select().from(products).where(and(inArray(products.id, ids), eq(products.status, "active")));
      if (rows.length !== ids.length) {
        throw new OrderError("unavailable", "أحد المنتجات في سلتك لم يعد متوفرًا. حدّث السلة ثم أعد المحاولة.");
      }

      const lines = rows.map((p) => ({ product: p, quantity: qtyById.get(p.id)!, unitPrice: p.price }));

      for (const line of lines) {
        const updated = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${line.quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, line.product.id), gte(products.stock, line.quantity)));
        if (updated.rowsAffected !== 1) {
          const left = line.product.stock;
          throw new OrderError(
            "stock",
            left > 0
              ? `الكمية المتوفرة من «${line.product.name}» هي ${left} فقط. عدّل الكمية ثم أعد المحاولة.`
              : `«${line.product.name}» نفد من المخزون حاليًا.`,
          );
        }
      }

      const totals = computeTotals(lines, deliveryFee);
      const publicToken = randomBytes(18).toString("base64url");

      const [order] = await tx
        .insert(orders)
        .values({
          reference: `TMP-${publicToken}`,
          publicToken,
          idempotencyKey: data.idempotencyKey,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          governorate: data.governorate,
          city: data.city,
          address: data.address,
          note: data.note ?? "",
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          paymentMethod: "cod",
          status: "new",
        })
        .returning({ id: orders.id });

      const reference = formatReference(order.id);
      await tx.update(orders).set({ reference }).where(eq(orders.id, order.id));

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.product.id,
          productName: l.product.name,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          lineTotal: l.unitPrice * l.quantity,
        })),
      );
      await tx.insert(orderStatusHistory).values({ orderId: order.id, fromStatus: null, toStatus: "new", adminName: "الموقع" });

      return { publicToken, reference, duplicate: false };
    }, { behavior: "immediate" }));
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, code: err.code, message: err.message };
    if (isUniqueViolation(err)) {
      // A concurrent request with the same key won the race.
      const again = await findByIdempotencyKey(db, data.idempotencyKey);
      if (again) return { ok: true, ...again, duplicate: true };
    }
    throw err;
  }
}

export type StatusChangeResult = { ok: true } | { ok: false; message: string };

/**
 * Changes an order's status and keeps stock consistent:
 * cancelling returns items to stock; re-opening a cancelled order takes them again.
 */
export async function changeOrderStatus(
  db: Database,
  orderId: number,
  toStatus: OrderStatus,
  admin: { id: number | null; name: string },
): Promise<StatusChangeResult> {
  try {
    await withRetry(() => db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) throw new OrderError("unavailable", "الطلب غير موجود.");
      if (order.status === toStatus) return;

      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      let stockRestored = order.stockRestored;

      if (toStatus === "cancelled" && !order.stockRestored) {
        for (const item of items) {
          if (!item.productId) continue;
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
        stockRestored = true;
      } else if (order.status === "cancelled" && order.stockRestored) {
        for (const item of items) {
          if (!item.productId) continue;
          const updated = await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)));
          if (updated.rowsAffected !== 1) {
            throw new OrderError("stock", `لا يوجد مخزون كافٍ من «${item.productName}» لإعادة فتح هذا الطلب.`);
          }
        }
        stockRestored = false;
      }

      await tx.update(orders).set({ status: toStatus, stockRestored, updatedAt: new Date() }).where(eq(orders.id, orderId));
      await tx.insert(orderStatusHistory).values({
        orderId,
        fromStatus: order.status,
        toStatus,
        adminId: admin.id,
        adminName: admin.name,
      });
    }, { behavior: "immediate" }));
    return { ok: true };
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, message: err.message };
    throw err;
  }
}
