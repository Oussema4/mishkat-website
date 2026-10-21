"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/db/schema";
import { ar, fill } from "@/i18n/ar";
import { PRODUCT_CUTOUTS } from "@/lib/product-cutouts";
import { cn } from "@/lib/site";

export function ProductGallery({ images, name, slug }: { images: ProductImage[]; name: string; slug: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  // The first picture is the studio shot on white: on the black store it shows as its cutout.
  const cutout = index === 0 ? PRODUCT_CUTOUTS[slug] : undefined;
  if (!current) return <div className="rounded-2xl aspect-[4/5] bg-mist" />;

  return (
    <div>
      <div className="relative isolate grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-ink-soft">
        {cutout ? (
          <>
            <span aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgb(212_164_64/0.3),transparent)]" />
            <Image
              key="cutout"
              src={cutout.src}
              alt={current.alt || name}
              width={cutout.width}
              height={cutout.height}
              priority
              sizes="(min-width: 1024px) 440px, 76vw"
              className="h-auto w-[80%] animate-[toast-in_200ms_ease-out]"
            />
          </>
        ) : (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || name}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 560px, 92vw"
            className="animate-[toast-in_200ms_ease-out] object-contain"
          />
        )}
      </div>
      {images.length > 1 ? (
        <ul aria-label={ar.product.gallery} className="mt-4 grid grid-cols-6 gap-2">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={fill(ar.product.showImage, { n: i + 1 })}
                aria-pressed={i === index}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] border-2 bg-mist transition-colors",
                  i === index ? "border-gold" : "border-transparent hover:border-line",
                )}
              >
                {i === 0 && PRODUCT_CUTOUTS[slug] ? (
                  <Image src={PRODUCT_CUTOUTS[slug].src} alt="" fill sizes="96px" className="object-contain p-1.5" />
                ) : (
                  <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
