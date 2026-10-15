import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Money is stored as integer millimes (1 TND = 1000 millimes) to avoid float errors. */

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
};

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type FaqItem = { q: string; a: string };
export type ContentItem = { label: string; value: string };
export type HowToStep = { title: string; body: string };

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    stock: integer("stock").notNull().default(0),
    status: text("status", { enum: ["active", "hidden"] }).notNull().default("active"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    ageRange: text("age_range").notNull().default(""),
    players: text("players").notNull().default(""),
    contents: text("contents", { mode: "json" }).$type<ContentItem[]>().notNull().default(sql`'[]'`),
    howToPlay: text("how_to_play", { mode: "json" }).$type<HowToStep[]>().notNull().default(sql`'[]'`),
    benefits: text("benefits", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    faq: text("faq", { mode: "json" }).$type<FaqItem[]>().notNull().default(sql`'[]'`),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("products_status_idx").on(t.status)],
);

export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const ORDER_STATUSES = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reference: text("reference").notNull().unique(),
    publicToken: text("public_token").notNull().unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    governorate: text("governorate").notNull(),
    city: text("city").notNull(),
    address: text("address").notNull(),
    note: text("note").notNull().default(""),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    total: integer("total").notNull(),
    paymentMethod: text("payment_method", { enum: ["cod"] }).notNull().default("cod"),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("new"),
    stockRestored: integer("stock_restored", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt), index("orders_phone_idx").on(t.phone)],
);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
});

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  adminId: integer("admin_id").references(() => admins.id, { onDelete: "set null" }),
  adminName: text("admin_name").notNull().default(""),
  createdAt: timestamps.createdAt,
});

export const admins = sqliteTable(
  "admins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sessionVersion: integer("session_version").notNull().default(1),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("admins_email_idx").on(t.email)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: timestamps.updatedAt,
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageUrl: text("image_url").notNull(),
  width: integer("width").notNull().default(720),
  height: integer("height").notNull().default(720),
  alt: text("alt").notNull().default(""),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamps.createdAt,
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Review = typeof reviews.$inferSelect;
