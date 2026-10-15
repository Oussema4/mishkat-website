"use server";

/**
 * Dashboard server actions. Every action re-checks the session with requireAdmin():
 * server actions are public HTTP endpoints, so the page-level guard alone is not enough.
 */
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { admins, categories, ORDER_STATUSES, productImages, products, reviews } from "@/db/schema";
import { parseFaq, parseLabelValues, parseLines, parseSteps, parseTND, slugify } from "@/lib/admin-format";
import { normalizeTunisianPhone } from "@/lib/tunisia";
import { endSession, getCurrentAdmin, hashPassword, requireAdmin, startSession, verifyPassword } from "@/server/auth";
import { changeOrderStatus } from "@/server/order-core";
import { saveSettings } from "@/server/settings";
import { deleteImage, saveImage } from "@/server/uploads";

export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

/** Store pages are pre-rendered — refresh them after any catalogue/settings change. */
function refreshStore() {
  revalidatePath("/", "layout");
}

// ───────────── Auth ─────────────

export type LoginState = { error?: string; email?: string };

const loginAttempts = new Map<string, { count: number; until: number }>();

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}:${email}`;
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.until > now && attempt.count >= 5) {
    return { error: "محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.", email };
  }

  const [admin] = email ? await db.select().from(admins).where(eq(admins.email, email)).limit(1) : [];
  // Always run bcrypt so response time doesn't reveal whether the email exists.
  const valid = await verifyPassword(password, admin?.passwordHash);

  if (!admin || !admin.active || !valid) {
    const next = attempt && attempt.until > now ? attempt.count + 1 : 1;
    loginAttempts.set(key, { count: next, until: now + 15 * 60 * 1000 });
    return { error: "البريد الإلكتروني أو كلمة السر غير صحيحة.", email };
  }

  loginAttempts.delete(key);
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, admin.id));
  await startSession(admin);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ───────────── Orders ─────────────

export async function updateOrderStatus(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const orderId = Number(form.get("orderId"));
  const status = String(form.get("status"));
  if (!Number.isInteger(orderId) || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { error: "بيانات غير صالحة." };
  }
  const result = await changeOrderStatus(db, orderId, status as (typeof ORDER_STATUSES)[number], admin);
  if (!result.ok) return { error: result.message };
  revalidatePath("/admin", "layout");
  refreshStore();
  return { ok: true, message: "تم تحديث حالة الطلب." };
}

// ───────────── Products ─────────────

const productSchema = z.object({
  name: z.string().trim().min(1, "اسم المنتج مطلوب").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "الرابط مطلوب")
    .max(60)
    .regex(/^[a-z0-9؀-ۿ-]+$/, "الرابط: أحرف وأرقام وشرطات فقط"),
  tagline: z.string().trim().max(160),
  shortDescription: z.string().trim().max(400),
  description: z.string().trim().max(5000),
  stock: z.coerce.number().int("المخزون رقم صحيح").min(0, "المخزون لا يكون سالبًا").max(100000),
  status: z.enum(["active", "hidden"]),
  categoryId: z.coerce.number().int().optional(),
  ageRange: z.string().trim().max(80),
  players: z.string().trim().max(80),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(form.get("id")) || null;
  const raw = Object.fromEntries(form.entries());
  const parsed = productSchema.safeParse({
    ...raw,
    slug: slugify(String(raw.slug || raw.name || "")),
    categoryId: raw.categoryId ? raw.categoryId : undefined,
  });
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  }

  const price = parseTND(String(raw.price ?? ""));
  if (price === null || price <= 0) fieldErrors.price = "اكتب سعرًا صحيحًا بالدينار، مثل 48 أو 48.500";
  const compareRaw = String(raw.compareAtPrice ?? "").trim();
  const compareAtPrice = compareRaw ? parseTND(compareRaw) : null;
  if (compareRaw && compareAtPrice === null) fieldErrors.compareAtPrice = "سعر غير صالح";
  if (compareAtPrice !== null && price !== null && compareAtPrice <= price) {
    fieldErrors.compareAtPrice = "السعر قبل التخفيض يجب أن يكون أكبر من السعر الحالي (أو اتركه فارغًا)";
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "راجع الحقول المظلّلة.", fieldErrors };
  }

  const data = parsed.data;
  const [clash] = await db
    .select({ id: products.id })
    .from(products)
    .where(id ? and(eq(products.slug, data.slug), ne(products.id, id)) : eq(products.slug, data.slug))
    .limit(1);
  if (clash) return { error: "هذا الرابط مستعمل لمنتج آخر.", fieldErrors: { slug: "الرابط مستعمل" } };

  const values = {
    ...data,
    categoryId: data.categoryId || null,
    price: price!,
    compareAtPrice,
    contents: parseLabelValues(String(raw.contents ?? "")),
    howToPlay: parseSteps(String(raw.howToPlay ?? "")),
    benefits: parseLines(String(raw.benefits ?? "")),
    faq: parseFaq(String(raw.faq ?? "")),
    featured: raw.featured === "on",
    updatedAt: new Date(),
  };

  let productId = id;
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
  } else {
    const [created] = await db.insert(products).values(values).returning({ id: products.id });
    productId = created.id;
  }
  if (values.featured) {
    await db.update(products).set({ featured: false }).where(ne(products.id, productId!));
  }

  revalidatePath("/admin", "layout");
  refreshStore();
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return { ok: true, message: "تم حفظ المنتج." };
}

export async function uploadProductImage(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const productId = Number(form.get("productId"));
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  const file = form.get("image");
  if (!Number.isInteger(productId) || !(file instanceof File)) return { error: "اختر صورة." };
  const saved = await saveImage(file, "products");
  if (!saved.ok) return { error: saved.error };
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${productImages.sortOrder}), -1)` })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  await db.insert(productImages).values({ productId, url: saved.url, alt, sortOrder: Number(max) + 1 });
  revalidatePath("/admin", "layout");
  refreshStore();
  return { ok: true, message: "تمت إضافة الصورة." };
}

export async function deleteProductImage(form: FormData) {
  await requireAdmin();
  const imageId = Number(form.get("imageId"));
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) return;
  await db.delete(productImages).where(eq(productImages.id, imageId));
  await deleteImage(img.url);
  revalidatePath("/admin", "layout");
  refreshStore();
}

export async function moveProductImage(form: FormData) {
  await requireAdmin();
  const imageId = Number(form.get("imageId"));
  const direction = form.get("direction") === "up" ? -1 : 1;
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) return;
  const siblings = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, img.productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  const index = siblings.findIndex((s) => s.id === imageId);
  const swap = siblings[index + direction];
  if (!swap) return;
  const reordered = [...siblings];
  [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
  for (const [i, s] of reordered.entries()) {
    await db.update(productImages).set({ sortOrder: i }).where(eq(productImages.id, s.id));
  }
  revalidatePath("/admin", "layout");
  refreshStore();
}

export async function updateImageAlt(form: FormData) {
  await requireAdmin();
  const imageId = Number(form.get("imageId"));
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  await db.update(productImages).set({ alt }).where(eq(productImages.id, imageId));
  refreshStore();
}

export async function createCategory(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "اكتب اسم التصنيف." };
  const slug = slugify(String(form.get("slug") || name)) || `cat-${Date.now()}`;
  const [exists] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (exists) return { error: "يوجد تصنيف بنفس الرابط." };
  await db.insert(categories).values({ name, slug });
  revalidatePath("/admin", "layout");
  refreshStore();
  return { ok: true, message: "تمت إضافة التصنيف." };
}

// ───────────── Settings ─────────────

export async function saveStoreSettings(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const fee = parseTND(String(form.get("deliveryFee") ?? ""));
  if (fee === null) return { error: "مصاريف التوصيل غير صالحة.", fieldErrors: { deliveryFee: "اكتب مبلغًا مثل 8 أو 7.500" } };

  const whatsappRaw = String(form.get("whatsapp") ?? "").trim();
  let whatsapp = "";
  if (whatsappRaw) {
    const local = normalizeTunisianPhone(whatsappRaw);
    const digits = whatsappRaw.replace(/\D/g, "");
    whatsapp = local ? `216${local}` : digits.length >= 10 && digits.length <= 15 ? digits : "";
    if (!whatsapp) return { error: "رقم واتساب غير صالح.", fieldErrors: { whatsapp: "مثال: 92359349 أو 21692359349" } };
  }

  const url = (key: string) => {
    const v = String(form.get(key) ?? "").trim();
    return v && !/^https?:\/\//.test(v) ? `https://${v}` : v;
  };

  await saveSettings({
    deliveryFee: fee,
    deliveryTime: String(form.get("deliveryTime") ?? "").trim().slice(0, 40),
    whatsapp,
    phone: String(form.get("phone") ?? "").trim().slice(0, 40),
    email: String(form.get("email") ?? "").trim().slice(0, 120),
    instagram: url("instagram"),
    facebook: url("facebook"),
    policyDelivery: String(form.get("policyDelivery") ?? "").slice(0, 6000),
    policyReturns: String(form.get("policyReturns") ?? "").slice(0, 6000),
    faq: parseFaq(String(form.get("faq") ?? "")),
  });
  refreshStore();
  return { ok: true, message: "تم حفظ الإعدادات." };
}

// ───────────── Reviews ─────────────

export async function uploadReview(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const file = form.get("image");
  if (!(file instanceof File)) return { error: "اختر صورة." };
  const saved = await saveImage(file, "reviews");
  if (!saved.ok) return { error: saved.error };
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${reviews.sortOrder}), 0)` }).from(reviews);
  await db.insert(reviews).values({
    imageUrl: saved.url,
    width: saved.width,
    height: saved.height,
    alt: "رسالة من أحد عملاء مشكاة",
    sortOrder: Number(max) + 1,
  });
  revalidatePath("/admin", "layout");
  refreshStore();
  return { ok: true, message: "تمت إضافة الرأي. تأكّد أن الصورة لا تُظهر اسم الشخص أو صورته." };
}

export async function toggleReview(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  await db.update(reviews).set({ visible: sql`not ${reviews.visible}` }).where(eq(reviews.id, id));
  revalidatePath("/admin", "layout");
  refreshStore();
}

export async function deleteReview(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const [row] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!row) return;
  await db.delete(reviews).where(eq(reviews.id, id));
  await deleteImage(row.imageUrl);
  revalidatePath("/admin", "layout");
  refreshStore();
}

// ───────────── Admin accounts ─────────────

const newAdminSchema = z.object({
  name: z.string().trim().min(2, "اكتب الاسم").max(80),
  email: z.email("بريد إلكتروني غير صالح").trim().toLowerCase(),
  password: z.string().min(10, "كلمة السر 10 أحرف على الأقل").max(200),
});

export async function createAdmin(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = newAdminSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "راجع الحقول.", fieldErrors };
  }
  const [exists] = await db.select().from(admins).where(eq(admins.email, parsed.data.email)).limit(1);
  if (exists) return { error: "يوجد حساب بهذا البريد.", fieldErrors: { email: "مستعمل" } };
  await db.insert(admins).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "تم إنشاء الحساب." };
}

export async function setAdminActive(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get("id"));
  const active = form.get("active") === "1";
  if (id === me.id && !active) return; // never lock yourself out
  await db
    .update(admins)
    .set({ active, sessionVersion: sql`${admins.sessionVersion} + 1`, updatedAt: new Date() })
    .where(eq(admins.id, id));
  revalidatePath("/admin", "layout");
}

export async function changeOwnPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin/login");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10) return { error: "كلمة السر الجديدة 10 أحرف على الأقل.", fieldErrors: { next: "10 أحرف على الأقل" } };
  const [row] = await db.select().from(admins).where(eq(admins.id, me.id)).limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return { error: "كلمة السر الحالية غير صحيحة.", fieldErrors: { current: "غير صحيحة" } };
  }
  const [updated] = await db
    .update(admins)
    .set({ passwordHash: await hashPassword(next), sessionVersion: sql`${admins.sessionVersion} + 1`, updatedAt: new Date() })
    .where(eq(admins.id, me.id))
    .returning();
  await startSession(updated); // other devices are signed out, this one stays in
  return { ok: true, message: "تم تغيير كلمة السر." };
}
