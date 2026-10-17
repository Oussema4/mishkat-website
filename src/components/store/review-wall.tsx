"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Review } from "@/db/schema";

const INITIAL = 6;

/** Masonry of real customer screenshots; each opens full size in an accessible dialog. */
export function ReviewWall({ reviews }: { reviews: Review[] }) {
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState<Review | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = showAll ? reviews : reviews.slice(0, INITIAL);

  const open = (r: Review) => {
    setActive(r);
    dialog.current?.showModal();
  };

  return (
    <>
      <ul className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {visible.map((r, i) => (
          <li key={r.id} className="mb-5 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(r)}
              className="block w-full overflow-hidden rounded-[var(--radius-lg)] border border-paper/10 transition-[border-color] duration-150 hover:border-gold/60"
              aria-label={`تكبير الرسالة ${i + 1}`}
            >
              <Image
                src={r.imageUrl}
                alt={r.alt}
                width={r.width}
                height={r.height}
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw"
                className="h-auto w-full"
              />
            </button>
          </li>
        ))}
      </ul>
      {reviews.length > INITIAL && !showAll ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-gold/70 px-6 font-semibold text-gold transition-colors hover:bg-gold hover:text-ink"
          >
            عرض كل الرسائل ({reviews.length})
          </button>
        </div>
      ) : null}

      <dialog
        ref={dialog}
        onClose={() => setActive(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="review-dialog m-auto max-h-[92dvh] w-[min(92vw,44rem)] overflow-visible bg-transparent p-0 backdrop:bg-ink/85"
        aria-label="رسالة من أحد العملاء"
      >
        {active ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="absolute -top-14 end-0 inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink"
              aria-label="إغلاق"
              autoFocus
            >
              <X aria-hidden className="size-5" />
            </button>
            <Image
              src={active.imageUrl}
              alt={active.alt}
              width={active.width}
              height={active.height}
              sizes="44rem"
              className="mx-auto h-auto max-h-[85dvh] w-auto rounded-[var(--radius-lg)]"
            />
          </div>
        ) : null}
      </dialog>
    </>
  );
}
