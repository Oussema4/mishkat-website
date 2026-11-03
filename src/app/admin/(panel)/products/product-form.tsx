"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { AdminField, FormMessage, SubmitButton, adminInput, describe, keepValuesOnSubmit } from "@/components/admin/form-bits";
import type { Category, Product, ProductText } from "@/db/schema";
import { formatBundles, formatFaq, formatLabelValues, formatSteps, formatTNDInput } from "@/lib/admin-format";
import { uploadImages } from "@/components/admin/upload-action";
import { cn } from "@/lib/site";
import { saveProduct, type FormState } from "../../actions";

export function ProductForm({
  product,
  categories,
  maystroProducts = null,
}: {
  product?: Product;
  categories: Category[];
  /** Maystro's catalogue when connected; the link field is shown only then. */
  maystroProducts?: { id: string; name: string; displayId: number | null }[] | null;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<string | null>(null);

  // Editing: a plain save. Creating: save the product first, then upload the chosen images to it
  // (one request each, so the Server Action stays small), then open the new product.
  const submit = async (prev: FormState, fd: FormData): Promise<FormState> => {
    if (product) return saveProduct(prev, fd);
    const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    fd.delete("images");
    fd.set("returnId", "1");
    const saved = await saveProduct(prev, fd);
    if (!saved.ok || !saved.productId) return saved;
    const page = `/admin/products/${saved.productId}?created=1`;
    if (files.length > 0) {
      const alt = String(fd.get("name") ?? "").trim();
      const uploaded = await uploadImages("product", files, { productId: String(saved.productId), alt }, (done, total) =>
        setProgress(`جاري رفع الصور: ${done} من ${total}`),
      );
      if (!uploaded.ok) {
        // The product exists now: open it so the remaining images can be added there.
        router.push(`${page}&upload=failed`);
        return { error: uploaded.error };
      }
    }
    router.push(page);
    return saved;
  };
  const [state, action, pending] = useActionState<FormState, FormData>(submit, {});
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

      {product ? null : (
        <Section title="صور المنتج">
          <AdminField id="images" label="اختر صورة أو أكثر" hint="JPG أو PNG أو WebP، حتى 6 ميغابايت للصورة. الأولى تكون الصورة الرئيسية، ويمكن ترتيبها بعد الحفظ.">
            <input
              {...describe("images", { hint: true })}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="block w-full text-sm file:me-3 file:min-h-10 file:rounded-md file:border-0 file:bg-ink file:px-4 file:text-paper"
            />
          </AdminField>
        </Section>
      )}

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
          <AdminField
            id="bundles"
            label="عروض الكمية (اختياري)"
            hint="عرض في كل سطر: العدد = السعر الجملي. مثلًا 2 = 100 ثم 3 = 150. في صفحة المنتج يكون أول عرض مختارًا من البداية."
            error={e.bundles}
            className="sm:col-span-2"
          >
            <textarea
              {...describe("bundles", { hint: true, error: e.bundles })}
              defaultValue={formatBundles(product?.bundles ?? [])}
              rows={3}
              dir="ltr"
              className={adminInput}
            />
          </AdminField>
          {maystroProducts ? (
            <AdminField
              id="maystroProductId"
              label="المنتج في Maystro"
              hint="نفس المنتج كما هو مسجّل في مخزن Maystro. بدونه لا يُرسل الطلب إلى التوصيل."
              error={e.maystroProductId}
              className="sm:col-span-2"
            >
              <select {...describe("maystroProductId", { hint: true, error: e.maystroProductId })} defaultValue={product?.maystroProductId ?? ""} className={adminInput}>
                <option value="">غير مربوط</option>
                {maystroProducts.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayId ? `${m.name} (#${m.displayId})` : m.name}
                  </option>
                ))}
              </select>
            </AdminField>
          ) : null}
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

      <Section title="الترجمة (الفرنسية والإنجليزية)">
        <p className="-mt-2 mb-4 text-sm leading-6 text-muted">
          ما يظهر في صفحات /fr و /en. نفس طريقة الكتابة كالحقول العربية أعلاه. أي حقل يُترك فارغًا يظهر بالعربية.
        </p>
        <div className="space-y-3">
          {(["fr", "en"] as const).map((lang) => (
            <TranslationFields key={lang} lang={lang} value={product?.translations?.[lang]} />
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-mist/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <SubmitButton pending={pending}>{product ? "حفظ التعديلات" : "إضافة المنتج"}</SubmitButton>
        <div className="flex-1">
          {pending && progress ? (
            <p role="status" className="text-sm font-medium text-muted">
              {progress}
            </p>
          ) : null}
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

/** The product's texts in one other language; fields are named `fr.name`, `en.faq`, … */
function TranslationFields({ lang, value }: { lang: "fr" | "en"; value?: Partial<ProductText> }) {
  const id = (field: string) => `${lang}.${field}`;
  const v = value ?? {};
  return (
    <details className="rounded-[var(--radius-md)] border border-line p-4 open:pb-5" open={lang === "fr"}>
      <summary className="cursor-pointer font-semibold">{lang === "fr" ? "Français" : "English"}</summary>
      <div dir="ltr" lang={lang} className="mt-4 grid gap-5 text-start md:grid-cols-2">
        <AdminField id={id("name")} label="Name">
          <input {...describe(id("name"), {})} defaultValue={v.name ?? ""} className={adminInput} />
        </AdminField>
        <AdminField id={id("tagline")} label="Tagline">
          <input {...describe(id("tagline"), {})} defaultValue={v.tagline ?? ""} className={adminInput} />
        </AdminField>
        <AdminField id={id("shortDescription")} label="Short description" className="md:col-span-2">
          <textarea {...describe(id("shortDescription"), {})} defaultValue={v.shortDescription ?? ""} rows={2} className={adminInput} />
        </AdminField>
        <AdminField id={id("description")} label="Description" className="md:col-span-2">
          <textarea {...describe(id("description"), {})} defaultValue={v.description ?? ""} rows={6} className={adminInput} />
        </AdminField>
        <AdminField id={id("ageRange")} label="Age">
          <input {...describe(id("ageRange"), {})} defaultValue={v.ageRange ?? ""} className={adminInput} />
        </AdminField>
        <AdminField id={id("players")} label="Players">
          <input {...describe(id("players"), {})} defaultValue={v.players ?? ""} className={adminInput} />
        </AdminField>
        <AdminField id={id("contents")} label="What's in the box (Label: value)" className="md:col-span-2">
          <textarea {...describe(id("contents"), {})} defaultValue={formatLabelValues(v.contents ?? [])} rows={4} className={adminInput} />
        </AdminField>
        <AdminField id={id("howToPlay")} label="How to play" className="md:col-span-2">
          <textarea {...describe(id("howToPlay"), {})} defaultValue={formatSteps(v.howToPlay ?? [])} rows={8} className={adminInput} />
        </AdminField>
        <AdminField id={id("benefits")} label="Benefits (one per line)" className="md:col-span-2">
          <textarea {...describe(id("benefits"), {})} defaultValue={(v.benefits ?? []).join("\n")} rows={4} className={adminInput} />
        </AdminField>
        <AdminField id={id("faq")} label="FAQ" className="md:col-span-2">
          <textarea {...describe(id("faq"), {})} defaultValue={formatFaq(v.faq ?? [])} rows={6} className={adminInput} />
        </AdminField>
      </div>
    </details>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn("rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-soft)]", className)}>
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden className="mb-5 font-sans text-lg font-bold">
        {title}
      </h2>
      {children}
    </fieldset>
  );
}
