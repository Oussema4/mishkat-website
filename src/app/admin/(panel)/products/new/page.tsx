import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCategories } from "@/server/catalog";
import { ProductForm } from "../product-form";

export const metadata = { title: "منتج جديد" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowRight aria-hidden className="size-4" />
        كل المنتجات
      </Link>
      <h1 className="text-3xl">منتج جديد</h1>
      <p className="text-muted">بعد الحفظ يمكنك إضافة صور المنتج.</p>
      <ProductForm categories={categories} />
    </div>
  );
}
