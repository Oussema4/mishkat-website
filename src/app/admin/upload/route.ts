/**
 * Image uploads for the dashboard (product photos, customer-message screenshots).
 * They live here rather than in Server Actions so that the Server Action body limit can stay at the
 * 1 MB default: that limit also covers the public actions (checkout), which never need more.
 */
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { productImages, products, reviews } from "@/db/schema";
import { getCurrentAdmin } from "@/server/auth";
import { saveImage } from "@/server/uploads";

const MAX_BODY = 6 * 1024 * 1024 + 64 * 1024; // the image limit plus room for the form fields

const reply = (status: number, body: { ok?: boolean; error?: string; message?: string }) => NextResponse.json(body, { status });

export async function POST(request: NextRequest) {
  // Route handlers don't get the Server Actions' built-in origin check, so do it here: a page on
  // another site must not be able to post with the admin's cookie.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) return reply(403, { error: "طلب غير مسموح." });

  const admin = await getCurrentAdmin();
  if (!admin) return reply(401, { error: "انتهت الجلسة. سجّل الدخول من جديد." });

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return reply(413, { error: "حجم الصورة أكبر من 6 ميغابايت." });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { error: "تعذّرت قراءة الطلب." });
  }
  const file = form.get("image");
  if (!(file instanceof File)) return reply(400, { error: "اختر صورة." });

  const kind = form.get("kind");
  if (kind === "product") {
    const productId = Number(form.get("productId"));
    const [product] = Number.isInteger(productId)
      ? await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1)
      : [];
    if (!product) return reply(400, { error: "المنتج غير موجود." });
    const alt = String(form.get("alt") ?? "").trim().slice(0, 200);

    const saved = await saveImage(file, "products");
    if (!saved.ok) return reply(400, { error: saved.error });
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${productImages.sortOrder}), -1)` })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    await db.insert(productImages).values({ productId, url: saved.url, alt, sortOrder: Number(max) + 1 });
    revalidatePath("/[lang]", "layout");
    return reply(200, { ok: true, message: "تمت إضافة الصورة." });
  }

  if (kind === "review") {
    const saved = await saveImage(file, "reviews");
    if (!saved.ok) return reply(400, { error: saved.error });
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${reviews.sortOrder}), 0)` }).from(reviews);
    await db.insert(reviews).values({
      imageUrl: saved.url,
      width: saved.width,
      height: saved.height,
      alt: "رسالة من أحد عملاء مشكاة",
      sortOrder: Number(max) + 1,
    });
    revalidatePath("/[lang]", "layout");
    return reply(200, { ok: true, message: "تمت إضافة الرأي. تأكّد أن الصورة لا تُظهر اسم الشخص أو صورته." });
  }

  return reply(400, { error: "نوع غير معروف." });
}
