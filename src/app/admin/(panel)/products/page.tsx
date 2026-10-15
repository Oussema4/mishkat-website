import { asc, eq, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { StockBadge } from "@/components/ui/stock-badge";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { formatTND } from "@/lib/money";

export const metadata = { title: "المنتجات" };

export default async function AdminProductsPage() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      status: products.status,
      image: sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = ${products.id} order by ${productImages.sortOrder} limit 1)`,
    })
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">المنتجات</h1>
        <ButtonLink href="/admin/products/new">
          <Plus aria-hidden className="size-5" />
          منتج جديد
        </ButtonLink>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/products/${p.id}`}
              className="flex gap-4 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-sand">
                {p.image ? <Image src={p.image} alt="" fill sizes="80px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-lg font-semibold">{p.name}</p>
                  {p.status === "hidden" ? <span className="rounded-full bg-sand px-2 text-xs text-muted">مخفي</span> : null}
                </div>
                <p className="font-semibold tabular">{formatTND(p.price)}</p>
                <StockBadge stock={p.stock} />
                <p className="text-xs text-muted tabular">المخزون: {p.stock}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="text-muted">لا توجد منتجات بعد.</p> : null}
    </div>
  );
}
