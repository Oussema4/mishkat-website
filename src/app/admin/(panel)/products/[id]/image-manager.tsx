"use client";

import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef } from "react";
import { FormMessage, SubmitButton, adminInput } from "@/components/admin/form-bits";
import type { ProductImage } from "@/db/schema";
import { deleteProductImage, moveProductImage, updateImageAlt, uploadProductImage, type FormState } from "../../../actions";

export function ImageManager({ productId, images }: { productId: number; images: ProductImage[] }) {
  const [state, action] = useActionState<FormState, FormData>(uploadProductImage, {});
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section aria-labelledby="images-title" className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]">
      <h2 id="images-title" className="font-sans text-lg font-bold">
        صور المنتج
      </h2>
      <p className="mt-1 text-sm text-muted">الصورة الأولى هي الصورة الرئيسية في المتجر. استعمل صورًا حقيقية للمنتج.</p>

      {images.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {images.map((img, i) => (
            <li key={img.id} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-mist">
                <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                {i === 0 ? <span className="absolute start-2 top-2 rounded-full bg-ink px-2 text-xs text-paper">الرئيسية</span> : null}
              </div>
              <form action={updateImageAlt}>
                <input type="hidden" name="imageId" value={img.id} />
                <label htmlFor={`alt-${img.id}`} className="sr-only">
                  وصف الصورة {i + 1}
                </label>
                <input
                  id={`alt-${img.id}`}
                  name="alt"
                  defaultValue={img.alt}
                  placeholder="وصف الصورة"
                  onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                  className={`${adminInput} min-h-9 py-1 text-sm`}
                />
              </form>
              <div className="flex items-center justify-between">
                <div className="flex">
                  <form action={moveProductImage}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={i === 0} aria-label="تقديم الصورة" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-mist disabled:opacity-30">
                      <ArrowRight aria-hidden className="size-4" />
                    </button>
                  </form>
                  <form action={moveProductImage}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={i === images.length - 1}
                      aria-label="تأخير الصورة"
                      className="inline-flex size-9 items-center justify-center rounded-md hover:bg-mist disabled:opacity-30"
                    >
                      <ArrowLeft aria-hidden className="size-4" />
                    </button>
                  </form>
                </div>
                <form
                  action={deleteProductImage}
                  onSubmit={(e) => {
                    if (!confirm("حذف هذه الصورة؟")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="imageId" value={img.id} />
                  <button type="submit" aria-label="حذف الصورة" className="inline-flex size-9 items-center justify-center rounded-md text-danger hover:bg-danger-bg">
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-[var(--radius-md)] bg-mist p-4 text-muted">لا توجد صور بعد.</p>
      )}

      <form action={action} className="mt-6 grid gap-3 border-t border-line pt-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <input type="hidden" name="productId" value={productId} />
        <div>
          <label htmlFor="image" className="mb-1.5 block font-medium">
            إضافة صورة
          </label>
          <input
            ref={fileRef}
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm file:me-3 file:min-h-10 file:rounded-md file:border-0 file:bg-ink file:px-4 file:text-paper"
          />
        </div>
        <div>
          <label htmlFor="new-alt" className="mb-1.5 block font-medium">
            وصف الصورة
          </label>
          <input id="new-alt" name="alt" placeholder="مثلًا: علبة سبيلي من الأمام" className={adminInput} />
        </div>
        <SubmitButton>رفع الصورة</SubmitButton>
        <div className="md:col-span-3">
          <FormMessage state={state} />
        </div>
      </form>
    </section>
  );
}
