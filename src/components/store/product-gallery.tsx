"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import type { ProductImage } from "@/db/schema";
import { fill } from "@/i18n/ar";
import { useI18n } from "@/i18n/client";
import { PRODUCT_CUTOUTS, PRODUCT_VIDEOS } from "@/lib/product-cutouts";
import { cn } from "@/lib/site";

/**
 * The muted gameplay clip at the head of the gallery. It shows its poster at once (the page's
 * largest element) and only starts downloading and playing once the page has loaded, so it never
 * slows the first screen. Under reduced motion it waits for a tap; a button pauses it anytime.
 */
function GalleryVideo({ video, label }: { video: { src: string; poster: string }; label: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  preload(video.poster, { as: "image", fetchPriority: "high" });

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => void el.play().catch(() => {});
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  return (
    <>
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={toggle}
        className="absolute inset-0 size-full cursor-pointer object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.product.pauseVideo : t.product.showVideo}
        className="absolute bottom-3 start-3 inline-flex size-10 items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-colors hover:bg-ink"
      >
        {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
      </button>
    </>
  );
}

export function ProductGallery({ images, name, slug }: { images: ProductImage[]; name: string; slug: string }) {
  const { t, locale } = useI18n();
  const video = PRODUCT_VIDEOS[slug];
  // Slot 0 is the gameplay clip when the product has one; the photos follow.
  const slots = [...(video ? [null] : []), ...images];
  const [index, setIndex] = useState(0);
  // Fade only when the visitor switches images: on load the main image must show at once (it is
  // the page's largest element, and a fade from transparent delays it for Google's LCP).
  const [switched, setSwitched] = useState(false);
  const current = slots[index];
  // The studio shot on white shows as its cutout on the black store (wherever it is in the gallery).
  const cutoutFor = (url?: string) => (url && PRODUCT_CUTOUTS[slug]?.replaces === url ? PRODUCT_CUTOUTS[slug] : undefined);
  const cutout = cutoutFor(current?.url);
  if (slots.length === 0) return <div className="aspect-square rounded-2xl bg-mist md:aspect-[4/5]" />;

  return (
    <div>
      <div className="relative isolate grid aspect-square place-items-center overflow-hidden rounded-2xl bg-ink-soft md:aspect-[4/5]">
        {current === null && video ? (
          <GalleryVideo video={video} label={fill(t.product.video, { name })} />
        ) : cutout && current ? (
          <>
            <span aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgb(212_164_64/0.3),transparent)]" />
            <Image
              key="cutout"
              src={cutout.src}
              alt={(locale === "ar" && current.alt) || name}
              width={cutout.width}
              height={cutout.height}
              priority={index === 0}
              sizes="(min-width: 1024px) 440px, 76vw"
              className={cn("h-auto max-h-[88%] w-[80%] object-contain", switched && "animate-[toast-in_200ms_ease-out]")}
            />
          </>
        ) : current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={(locale === "ar" && current.alt) || name}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 560px, 92vw"
            className={cn("object-contain", switched && "animate-[toast-in_200ms_ease-out]")}
          />
        ) : null}
      </div>
      {slots.length > 1 ? (
        <ul aria-label={t.product.gallery} className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {slots.map((img, i) => (
            <li key={img?.id ?? "video"} className="w-14 shrink-0 md:w-16">
              <button
                type="button"
                onClick={() => {
                  setSwitched(true);
                  setIndex(i);
                }}
                aria-label={img ? fill(t.product.showImage, { n: i + (video ? 0 : 1) }) : t.product.showVideo}
                aria-pressed={i === index}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] border-2 bg-mist transition-colors",
                  i === index ? "border-gold" : "border-transparent hover:border-line",
                )}
              >
                {img === null && video ? (
                  <>
                    <Image src={video.poster} alt="" fill sizes="96px" className="object-cover" />
                    <span aria-hidden className="absolute inset-0 grid place-items-center bg-ink/35">
                      <Play className="size-5 fill-paper text-paper" />
                    </span>
                  </>
                ) : img && cutoutFor(img.url) ? (
                  <Image src={cutoutFor(img.url)!.src} alt="" fill sizes="96px" className="object-contain p-1.5" />
                ) : img ? (
                  <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
