import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { categories, productImages, products, reviews, type Product, type ProductImage } from "@/db/schema";

export type ProductWithImages = Product & { images: ProductImage[]; categoryName: string | null };

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

export const getActiveProducts = cache(async () => {
  const rows = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "active"))
    .orderBy(asc(products.sortOrder), asc(products.id));
  return attachImages(rows.map((r) => ({ ...r.product, categoryName: r.categoryName })));
});

export const getProductBySlug = cache(async (slug: string) => {
  const [row] = await db
    .select(productColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (!row) return null;
  const [withImages] = await attachImages([{ ...row.product, categoryName: row.categoryName }]);
  return withImages;
});

export const getFeaturedProduct = cache(async () => {
  const all = await getActiveProducts();
  return all.find((p) => p.featured) ?? all[0] ?? null;
});

export const getCategories = cache(async () => db.select().from(categories).orderBy(asc(categories.sortOrder)));

export const getVisibleReviews = cache(async () =>
  db.select().from(reviews).where(eq(reviews.visible, true)).orderBy(asc(reviews.sortOrder), asc(reviews.id)),
);

/** Fresh price/stock for cart lines (used to re-sync a cart saved in the browser). */
export async function getCartSnapshot(ids: number[]) {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: products.id, name: products.name, price: products.price, stock: products.stock, status: products.status })
    .from(products)
    .where(inArray(products.id, ids));
  return rows.map((r) => ({
    productId: r.id,
    name: r.name,
    unitPrice: r.price,
    maxQuantity: r.status === "active" ? r.stock : 0,
  }));
}
