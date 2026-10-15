"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/db/schema";
import { ar, fill } from "@/i18n/ar";
import { cn } from "@/lib/site";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  if (!current) return <div className="niche aspect-[4/5] bg-surface" />;

  return (
    <div>
      <div className="niche relative aspect-[4/5] overflow-hidden bg-surface">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt || name}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 560px, 92vw"
          className="animate-[toast-in_200ms_ease-out] object-contain"
        />
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
                  "relative block aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] border-2 bg-surface transition-colors",
                  i === index ? "border-gold" : "border-transparent hover:border-line-strong",
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
