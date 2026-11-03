import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import type { Locale } from "@/i18n/config";
import { categories, productImages, products, reviews, type Product, type ProductImage } from "@/db/schema";

export type ProductWithImages = Product & { images: ProductImage[]; categoryName: string | null };

const TEXT_FIELDS = ["name", "tagline", "shortDescription", "description", "ageRange", "players", "contents", "howToPlay", "benefits", "faq"] as const;

/** The product with its texts in this language; a field never translated keeps its Arabic text. */
export function localizeProduct<T extends Product>(product: T, locale: Locale): T {
  if (locale === "ar") return product;
  const tr = product.translations?.[locale];
  if (!tr) return product;
  const out = { ...product };
  for (const key of TEXT_FIELDS) {
    const value = tr[key];
    const filled = Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim() !== "";
    if (filled) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

async function attachImages(rows: (Product & { categoryName: string | null })[]): Promise<ProductWithImages[]> {
  if (rows.length === 0) return [];
  const imgs = await db
    .select()
    .from(productImages)
    .where(
      inArray(
        productImages.productId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  return rows.map((r) => ({ ...r, images: imgs.filter((i) => i.productId === r.id) }));
}

const productColumns = { product: products, categoryName: categories.name };

export const getActiveProducts = cache(async (locale: Locale = "ar") => {
  const rows = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "active"))
    .orderBy(asc(products.sortOrder), asc(products.id));
  const list = await attachImages(rows.map((r) => ({ ...r.product, categoryName: r.categoryName })));
  return list.map((p) => localizeProduct(p, locale));
});

export const getProductBySlug = cache(async (slug: string, locale: Locale = "ar") => {
  const [row] = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (!row) return null;
  const [withImages] = await attachImages([{ ...row.product, categoryName: row.categoryName }]);
  return localizeProduct(withImages, locale);
});

export const getFeaturedProduct = cache(async (locale: Locale = "ar") => {
  const all = await getActiveProducts(locale);
  return all.find((p) => p.featured) ?? all[0] ?? null;
});

export const getCategories = cache(async () => db.select().from(categories).orderBy(asc(categories.sortOrder)));

export const getVisibleReviews = cache(async () =>
  db.select().from(reviews).where(eq(reviews.visible, true)).orderBy(asc(reviews.sortOrder), asc(reviews.id)),
);

/** Fresh price/stock for cart lines (used to re-sync a cart saved in the browser). */
export async function getCartSnapshot(ids: number[], locale: Locale = "ar") {
  if (ids.length === 0) return [];
  // Active products only: this is a public endpoint, so hidden (draft) products must not leak their
  // name or price. A cart line whose product is missing here is dropped by syncProducts.
  const rows = await db
    .select({ id: products.id, name: products.name, translations: products.translations, price: products.price, bundles: products.bundles, stock: products.stock })
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.status, "active")));
  // Names in the shopper's language, so the cart follows a language switch.
  const name = (r: (typeof rows)[number]) => (locale !== "ar" && r.translations?.[locale]?.name?.trim()) || r.name;
  return rows.map((r) => ({ productId: r.id, name: name(r), unitPrice: r.price, bundles: r.bundles, maxQuantity: r.stock }));
}
