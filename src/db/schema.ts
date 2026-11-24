import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { CARRIER_IDS } from "../lib/carriers";

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
export type ProductText = {
  name: string;
  tagline: string;
  shortDescription: string;
  description: string;
  ageRange: string;
  players: string;
  contents: ContentItem[];
  howToPlay: HowToStep[];
  benefits: string[];
  faq: FaqItem[];
};
export type ProductTranslations = { fr?: Partial<ProductText>; en?: Partial<ProductText> };
/** Quantity offer: `quantity` pieces together cost `price` millimes (e.g. 2 for 100 TND). */
export type Bundle = { quantity: number; price: number };

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
    bundles: text("bundles", { mode: "json" }).$type<Bundle[]>().notNull().default(sql`'[]'`),
    /** French and English versions of the texts; a missing field falls back to Arabic. */
    translations: text("translations", { mode: "json" }).$type<ProductTranslations>().notNull().default(sql`'{}'`),
    /** The same product in the Maystro warehouse (UUID): required to ship it through Maystro. */
    maystroProductId: text("maystro_product_id"),
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

export const ADMIN_ROLES = ["owner", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** "postponed": the customer asked to be called or delivered later (not confirmed yet). */
export const ORDER_STATUSES = ["new", "postponed", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * The shop's own delivery people (freelance couriers), chosen on an order delivered "another way"
 * (carrier "manual"). A driver who stops working with the shop is deactivated, never deleted, so
 * past orders keep their name.
 */
export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  /** SHA-256 of the code the driver types once in the driver app (/driver); null = no access. */
  accessCodeHash: text("access_code_hash").unique(),
  /** Bumped when a new code is made: signs the driver out of every phone. */
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamps.createdAt,
});

/**
 * The account between the shop and a driver: boxes handed over or brought back, and cash the
 * driver handed in. What the driver delivered comes from his orders.
 */
/** deliverySettled: the delivery fees the driver kept, counted as paid when the shop takes his cash. */
export const DRIVER_LEDGER_KINDS = ["boxesGiven", "boxesReturned", "cashReceived", "deliverySettled"] as const;
export const driverLedger = sqliteTable(
  "driver_ledger",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    driverId: integer("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: DRIVER_LEDGER_KINDS }).notNull(),
    /** Boxes for the box kinds, millimes for cash and delivery fees. Always positive. */
    amount: integer("amount").notNull(),
    note: text("note").notNull().default(""),
    adminName: text("admin_name").notNull().default(""),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("driver_ledger_driver_idx").on(t.driverId)],
);

/** none: not sent · sent: parcel created at Maystro · failed: refused or unreachable (see maystroError). */
export const MAYSTRO_STATES = ["none", "sent", "failed"] as const;

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
    /** Maystro delegation (commune) id chosen at checkout; null for orders placed before. */
    communeId: integer("commune_id"),
    /** How the order is delivered, chosen in the dashboard (src/lib/carriers.ts); null = not chosen yet. */
    carrier: text("carrier", { enum: CARRIER_IDS }),
    /** With carrier "manual": the shop's delivery person who takes it, and when that was set. */
    driverId: integer("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    driverAssignedAt: integer("driver_assigned_at", { mode: "timestamp" }),
    /** Times the driver marked "the customer doesn't answer" (ما يهزش), and the last time. */
    noAnswerCount: integer("no_answer_count").notNull().default(0),
    noAnswerAt: integer("no_answer_at", { mode: "timestamp" }),
    // Delivery through Maystro: the parcel created there, its tracking number and last known status.
    maystroState: text("maystro_state", { enum: MAYSTRO_STATES }).notNull().default("none"),
    maystroOrderId: text("maystro_order_id"),
    maystroTracking: text("maystro_tracking"),
    maystroStatus: integer("maystro_status"),
    maystroError: text("maystro_error"),
    maystroSyncedAt: integer("maystro_synced_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt), index("orders_phone_idx").on(t.phone)],
);

/**
 * A checkout started but maybe not finished: saved as soon as the customer has typed a valid phone
 * number in the order form, then updated as they fill it in. `orderId` is set when the same
 * checkout (or the same phone soon after) becomes an order; otherwise it shows as abandoned.
 */
export type LeadItem = { productId: number; name: string; quantity: number; lineTotal: number };
export const checkoutLeads = sqliteTable(
  "checkout_leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** One per order form on the customer's screen (random, from the browser). */
    key: text("key").notNull().unique(),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    phone: text("phone").notNull(),
    governorate: text("governorate").notNull().default(""),
    city: text("city").notNull().default(""),
    address: text("address").notNull().default(""),
    items: text("items", { mode: "json" }).$type<LeadItem[]>().notNull().default(sql`'[]'`),
    subtotal: integer("subtotal").notNull().default(0),
    locale: text("locale").notNull().default("ar"),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    /** The shop dealt with it (called back, not interested…): hidden from the list. */
    dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("checkout_leads_phone_idx").on(t.phone), index("checkout_leads_created_idx").on(t.createdAt)],
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
    /** "owner" can manage dashboard accounts; "admin" runs the shop (orders, products, settings). */
    role: text("role", { enum: ADMIN_ROLES }).notNull().default("admin"),
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

/**
 * Shared counters for rate limits (login attempts, orders), so limits hold across every server
 * instance instead of living in one instance's memory. One row per key, reset when the window ends.
 */
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  /** Unix time in milliseconds when the current window ends. */
  resetAt: integer("reset_at").notNull(),
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type DriverLedgerEntry = typeof driverLedger.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type CheckoutLead = typeof checkoutLeads.$inferSelect;
