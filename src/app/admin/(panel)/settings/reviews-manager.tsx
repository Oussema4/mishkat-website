"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/form-bits";
import type { Review } from "@/db/schema";
import { cn } from "@/lib/site";
import { deleteReview, toggleReview, uploadReview, type FormState } from "../../actions";

export function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const [state, action] = useActionState<FormState, FormData>(uploadReview, {});
  return (
    <section aria-labelledby="reviews-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
      <h2 id="reviews-title" className="font-sans text-lg font-bold">
        آراء العملاء
      </h2>
      <p className="mt-1 text-sm text-muted">
        صور رسائل حقيقية فقط. قبل الرفع، قصّ الصورة أو موّه اسم الشخص وصورته الشخصية حفاظًا على خصوصيته.
      </p>

      <form action={action} className="mt-5 flex flex-wrap items-end gap-3 border-b border-line pb-5">
        <div className="min-w-60 flex-1">
          <label htmlFor="review-image" className="mb-1.5 block font-medium">
            صورة رأي جديد
          </label>
          <input
            id="review-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm file:me-3 file:min-h-10 file:rounded-md file:border-0 file:bg-ink file:px-4 file:text-paper"
          />
        </div>
        <SubmitButton>رفع</SubmitButton>
        <div className="basis-full">
          <FormMessage state={state} />
        </div>
      </form>

      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {reviews.map((r, i) => (
          <li key={r.id} className="space-y-2">
            <div className={cn("relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] bg-ink", !r.visible && "opacity-40")}>
              <Image src={r.imageUrl} alt={`رأي ${i + 1}`} fill sizes="200px" className="object-contain" />
            </div>
            <div className="flex items-center justify-between">
              <form action={toggleReview}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium hover:bg-mist">
                  {r.visible ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
                  {r.visible ? "ظاهر" : "مخفي"}
                </button>
              </form>
              <form
                action={deleteReview}
                onSubmit={(e) => {
                  if (!confirm("حذف هذا الرأي نهائيًا؟")) e.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" aria-label={`حذف الرأي ${i + 1}`} className="inline-flex size-9 items-center justify-center rounded-md text-danger hover:bg-danger-bg">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
