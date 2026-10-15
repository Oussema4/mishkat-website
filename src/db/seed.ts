/** Seeds the initial catalogue and reviews. Safe to run more than once. Run: npm run seed */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { databaseConfig } from "./config";
import * as schema from "./schema";
import { REVIEW_REPLACEMENTS, SABILI, SEED_CATEGORY, SEED_REVIEWS } from "./seed-data";

const db = drizzle(createClient(databaseConfig()), { schema });

async function main() {
  let [category] = await db.select().from(schema.categories).where(eq(schema.categories.slug, SEED_CATEGORY.slug));
  if (!category) [category] = await db.insert(schema.categories).values(SEED_CATEGORY).returning();

  const [existing] = await db.select().from(schema.products).where(eq(schema.products.slug, SABILI.slug));
  if (existing) {
    console.log("• سبيلي موجود مسبقًا، لم يتم تعديله");
  } else {
    const { images, ...product } = SABILI;
    const [created] = await db
      .insert(schema.products)
      .values({ ...product, categoryId: category.id })
      .returning();
    await db.insert(schema.productImages).values(images.map((img, i) => ({ ...img, productId: created.id, sortOrder: i })));
    console.log("✓ تمت إضافة سبيلي");
  }

  const reviewCount = (await db.select({ id: schema.reviews.id }).from(schema.reviews)).length;
  if (reviewCount === 0) {
    await db.insert(schema.reviews).values(SEED_REVIEWS);
    console.log(`✓ تمت إضافة ${SEED_REVIEWS.length} آراء`);
  }

  // Re-cropped screenshots (messages only): move existing rows to the new files. No-op once applied.
  for (const r of REVIEW_REPLACEMENTS) {
    const moved = await db
      .update(schema.reviews)
      .set({ imageUrl: r.to, width: r.width, height: r.height })
      .where(eq(schema.reviews.imageUrl, r.from))
      .returning({ id: schema.reviews.id });
    if (moved.length > 0) console.log(`✓ تحديث صورة رأي: ${r.to}`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
