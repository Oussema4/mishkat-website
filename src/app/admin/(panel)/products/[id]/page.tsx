import { asc, eq } from "drizzle-orm";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { getCategories } from "@/server/catalog";
import { ProductForm } from "../product-form";
import { CategoryForm } from "./category-form";
import { ImageManager } from "./image-manager";

export const metadata = { title: "تعديل منتج" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) notFound();
  const [images, categories] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowRight aria-hidden className="size-4" />
        كل المنتجات
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{product.name}</h1>
        {product.status === "active" ? (
          <Link href={`/products/${product.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-1.5 font-medium underline underline-offset-4">
            عرض في المتجر
            <ExternalLink aria-hidden className="size-4" />
          </Link>
        ) : null}
      </header>
      {created ? (
        <p role="status" className="rounded-[var(--radius-md)] bg-success-bg p-3 font-medium text-success">
          تمت إضافة المنتج. أضف صوره الآن.
        </p>
      ) : null}

      <ImageManager productId={product.id} images={images} />
      <ProductForm product={product} categories={categories} />
      <CategoryForm />
    </div>
  );
}
