"use client";

import { useActionState } from "react";
import { AdminField, FormMessage, SubmitButton, adminInput, describe, keepValuesOnSubmit } from "@/components/admin/form-bits";
import type { Category, Product } from "@/db/schema";
import { formatFaq, formatLabelValues, formatSteps, formatTNDInput } from "@/lib/admin-format";
import { cn } from "@/lib/site";
import { saveProduct, type FormState } from "../../actions";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const e = state.fieldErrors ?? {};

  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <Section title="المعلومات الأساسية">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminField id="name" label="اسم المنتج" error={e.name}>
            <input {...describe("name", { error: e.name })} defaultValue={product?.name} required className={adminInput} />
          </AdminField>
          <AdminField id="slug" label="رابط المنتج" hint="يظهر في العنوان: /products/الرابط — يفضّل أحرفًا لاتينية" error={e.slug}>
            <input {...describe("slug", { hint: true, error: e.slug })} defaultValue={product?.slug} dir="ltr" className={adminInput} />
          </AdminField>
          <AdminField id="tagline" label="سطر تعريفي قصير" className="md:col-span-2">
            <input {...describe("tagline", {})} defaultValue={product?.tagline} className={adminInput} />
          </AdminField>
          <AdminField id="shortDescription" label="وصف مختصر (يظهر في بطاقة المنتج)" className="md:col-span-2">
            <textarea {...describe("shortDescription", {})} defaultValue={product?.shortDescription} rows={2} className={adminInput} />
          </AdminField>
          <AdminField id="description" label="الوصف الكامل" hint="افصل بين الفقرات بسطر فارغ" className="md:col-span-2">
            <textarea {...describe("description", { hint: true })} defaultValue={product?.description} rows={7} className={adminInput} />
          </AdminField>
        </div>
      </Section>

      <Section title="السعر والمخزون">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField id="price" label="السعر (د.ت)" error={e.price}>
            <input {...describe("price", { error: e.price })} defaultValue={formatTNDInput(product?.price)} inputMode="decimal" dir="ltr" required className={adminInput} />
          </AdminField>
          <AdminField id="compareAtPrice" label="السعر قبل التخفيض (اختياري)" error={e.compareAtPrice}>
            <input
              {...describe("compareAtPrice", { error: e.compareAtPrice })}
              defaultValue={formatTNDInput(product?.compareAtPrice)}
              inputMode="decimal"
              dir="ltr"
              className={adminInput}
            />
          </AdminField>
          <AdminField id="stock" label="الكمية في المخزون" error={e.stock}>
            <input {...describe("stock", { error: e.stock })} type="number" min={0} defaultValue={product?.stock ?? 0} dir="ltr" required className={adminInput} />
          </AdminField>
          <AdminField id="status" label="الظهور في المتجر">
            <select {...describe("status", {})} defaultValue={product?.status ?? "active"} className={adminInput}>
              <option value="active">ظاهر</option>
              <option value="hidden">مخفي</option>
            </select>
          </AdminField>
          <AdminField id="categoryId" label="التصنيف">
            <select {...describe("categoryId", {})} defaultValue={product?.categoryId ?? ""} className={adminInput}>
              <option value="">بدون تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField id="sortOrder" label="ترتيب العرض" hint="الأصغر يظهر أولًا">
            <input {...describe("sortOrder", { hint: true })} type="number" min={0} defaultValue={product?.sortOrder ?? 0} dir="ltr" className={adminInput} />
          </AdminField>
          <div className="flex items-center gap-3 sm:col-span-2 lg:pt-8">
            <input id="featured" name="featured" type="checkbox" defaultChecked={product?.featured ?? false} className="size-5 accent-ink" />
            <label htmlFor="featured" className="font-medium">
              منتج مميّز (يظهر في الصفحة الرئيسية)
            </label>
          </div>
        </div>
      </Section>

      <Section title="تفاصيل المنتج">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminField id="ageRange" label="الفئة العمرية">
            <input {...describe("ageRange", {})} defaultValue={product?.ageRange} className={adminInput} />
          </AdminField>
          <AdminField id="players" label="عدد اللاعبين" hint="اتركه فارغًا لإخفائه">
            <input {...describe("players", { hint: true })} defaultValue={product?.players} className={adminInput} />
          </AdminField>
          <AdminField id="contents" label="محتويات العلبة" hint="سطر لكل عنصر بالشكل: التسمية: القيمة" className="md:col-span-2">
            <textarea {...describe("contents", { hint: true })} defaultValue={formatLabelValues(product?.contents ?? [])} rows={5} className={adminInput} />
          </AdminField>
          <AdminField id="howToPlay" label="طريقة اللعب" hint="لكل خطوة: العنوان في السطر الأول ثم الشرح تحته. افصل بين الخطوات بسطر فارغ." className="md:col-span-2">
            <textarea {...describe("howToPlay", { hint: true })} defaultValue={formatSteps(product?.howToPlay ?? [])} rows={10} className={adminInput} />
          </AdminField>
          <AdminField id="benefits" label="الفوائد التعليمية" hint="فائدة في كل سطر" className="md:col-span-2">
            <textarea {...describe("benefits", { hint: true })} defaultValue={(product?.benefits ?? []).join("\n")} rows={5} className={adminInput} />
          </AdminField>
          <AdminField id="faq" label="أسئلة شائعة عن المنتج" hint="السؤال في سطر والجواب تحته. افصل بين الأسئلة بسطر فارغ." className="md:col-span-2">
            <textarea {...describe("faq", { hint: true })} defaultValue={formatFaq(product?.faq ?? [])} rows={8} className={adminInput} />
          </AdminField>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-sand/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <SubmitButton pending={pending}>{product ? "حفظ التعديلات" : "إضافة المنتج"}</SubmitButton>
        <div className="flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn("rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-soft)]", className)}>
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden className="mb-5 font-sans text-lg font-bold">
        {title}
      </h2>
      {children}
    </fieldset>
  );
}
