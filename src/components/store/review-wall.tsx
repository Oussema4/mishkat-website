"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Review } from "@/db/schema";


/**
 * Masonry of real customer screenshots; each opens full size in an accessible dialog.
 * `initial` messages show at first (0: only the "read all" button until it is pressed).
 */
export function ReviewWall({ reviews, initial = 6, showAllLabel }: { reviews: Review[]; initial?: number; showAllLabel?: string }) {
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState<Review | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = showAll ? reviews : reviews.slice(0, initial);

  const open = (r: Review) => {
    setActive(r);
    dialog.current?.showModal();
  };

  return (
    <>
      {visible.length > 0 ? (
        <ul className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {visible.map((r, i) => (
            <li key={r.id} className="mb-5 break-inside-avoid">
              <button
                type="button"
                onClick={() => open(r)}
                className="block w-full overflow-hidden rounded-[var(--radius-lg)] transition-transform duration-200 ease-out hover:-translate-y-1 active:translate-y-0"
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
      ) : null}
      {reviews.length > initial && !showAll ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] bg-paper/10 px-6 font-semibold text-paper transition-colors hover:bg-gold hover:text-ink"
          >
            {showAllLabel ?? `عرض كل الرسائل (${reviews.length})`}
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
