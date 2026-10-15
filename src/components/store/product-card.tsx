import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { ar } from "@/i18n/ar";
import { buttonClass } from "@/components/ui/button";
import type { ProductWithImages } from "@/server/catalog";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const image = product.images[0];
  const href = `/products/${product.slug}`;
  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative block" tabIndex={-1} aria-hidden>
        <div className="niche-sm relative aspect-[4/5] overflow-hidden bg-sand">
          {image ? (
            <Image
              src={image.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
      </Link>
      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-display-md">
            <Link href={href} className="decoration-gold decoration-2 underline-offset-8 hover:underline">
              {product.name}
            </Link>
          </h2>
          <StockBadge stock={product.stock} className="mt-1.5 shrink-0" />
        </div>
        {product.tagline ? <p className="mt-1 font-semibold text-gold-deep">{product.tagline}</p> : null}
        <p className="mt-2 leading-7 text-muted">{product.shortDescription}</p>
        <div className="mt-auto pt-5">
          <Price price={product.price} compareAt={product.compareAtPrice} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={href} className={buttonClass("primary", "md")}>
            {ar.shop.details}
          </Link>
          <AddToCartButton
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              stock: product.stock,
              image: image?.url ?? "",
            }}
          />
        </div>
      </div>
    </article>
  );
}
