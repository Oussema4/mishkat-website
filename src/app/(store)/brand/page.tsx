import type { Metadata } from "next";
import { CircleCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { Divider, NicheMark } from "@/components/brand/niche-mark";
import { ProductCard } from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
import { StockBadge } from "@/components/ui/stock-badge";
import { ar } from "@/i18n/ar";
import { BRAND_IMAGES } from "@/lib/brand-images";
import { cn } from "@/lib/site";
import { getFeaturedProduct } from "@/server/catalog";

/** Living brand guide: built from the real components so it never drifts from the store. Not indexed. */
export const metadata: Metadata = { title: "هوية مشكاة", robots: { index: false, follow: false } };

type Swatch = { name: string; token: string; hex: string; use: string; dark?: boolean };

const PALETTE: { title: string; swatches: Swatch[] }[] = [
  {
    title: "ألوان العلامة",
    swatches: [
      { name: "حبر", token: "ink", hex: "#17140F", use: "النصوص، الأزرار الرئيسية، الأشرطة الداكنة والتذييل", dark: true },
      { name: "ذهبي المصباح", token: "gold", hex: "#D4A44C", use: "اللون المميّز: إبراز، مؤشرات، عناصر على الخلفيات الداكنة" },
      { name: "ذهبي عميق", token: "gold-deep", hex: "#7C5A14", use: "نصوص وأيقونات ذهبية على الخلفيات الفاتحة", dark: true },
      { name: "ذهبي فاتح", token: "gold-light", hex: "#F1DDA4", use: "تظليل خفيف، نصوص صغيرة على الزيتوني" },
      { name: "زيتوني", token: "zaytun", hex: "#2E5446", use: "اللون الثانوي: أشرطة تعليمية، روابط وأيقونات هادئة", dark: true },
      { name: "زيتوني فاتح", token: "zaytun-tint", hex: "#E5EDE7", use: "لوحات معلومات وطمأنة (الدفع عند الاستلام)" },
    ],
  },
  {
    title: "الخلفيات والنصوص",
    swatches: [
      { name: "عاجي", token: "paper", hex: "#FBF8F2", use: "الخلفية الرئيسية لكل الصفحات" },
      { name: "رملي", token: "sand", hex: "#F3ECDF", use: "خلفيات ثانوية: أقسام متناوبة، ملخصات، إطارات الصور" },
      { name: "أبيض", token: "surface", hex: "#FFFFFF", use: "البطاقات والحقول والنماذج" },
      { name: "نص ثانوي", token: "muted", hex: "#5F584C", use: "الأوصاف والتفاصيل الصغيرة", dark: true },
      { name: "حدود", token: "line", hex: "#E5DDCE", use: "الفواصل والحدود الهادئة" },
      { name: "حدود العناصر التفاعلية", token: "line-strong", hex: "#8F836E", use: "حدود الحقول والأزرار والشرائح (تباين 3:1 على الأقل)", dark: true },
    ],
  },
  {
    title: "الحالات",
    swatches: [
      { name: "نجاح", token: "success", hex: "#1D6B44", use: "متوفر، تمّ الطلب (مع أيقونة دائمًا)", dark: true },
      { name: "تحذير", token: "warning", hex: "#8A5300", use: "كمية محدودة، تنبيهات", dark: true },
      { name: "خطأ", token: "danger", hex: "#B42318", use: "أخطاء النماذج، نفاد المخزون، الحذف", dark: true },
    ],
  },
  {
    title: "عالم سبيلي (خاص باللعبة فقط)",
    swatches: [
      { name: "أزرق سبيلي", token: "sabili", hex: "#0025D7", use: "لون العلبة. لا يُستعمل لهوية مشكاة", dark: true },
      { name: "كحلي سبيلي", token: "sabili-navy", hex: "#1C2257", use: "خلفية أقسام سبيلي", dark: true },
      { name: "أصفر البطاقات", token: "sabili-yellow", hex: "#FFD200", use: "زر الشراء ولمسات الإبراز داخل عالم سبيلي" },
    ],
  },
];

const TYPE: { label: string; font: string; className: string; sample: string }[] = [
  { label: "عنوان رئيسي (Display XL)", font: "Alexandria 800", className: "text-display-xl", sample: "ليكن لعبك عملًا تؤجر عليه" },
  { label: "عنوان قسم (Display LG)", font: "Alexandria 700", className: "text-display-lg", sample: "كيف تجعل مشكاة التعلّم ممتعًا" },
  { label: "اسم منتج / عنوان فرعي (Display MD)", font: "Alexandria 700", className: "text-display-md", sample: "سبيلي" },
  { label: "عنوان بطاقة (Title)", font: "Alexandria 600", className: "text-title", sample: "سؤال يفتح نقاشًا" },
  { label: "نص كبير (Body LG)", font: "IBM Plex Sans Arabic 400", className: "text-body-lg", sample: "مشكاة تصنع ألعابًا تعليمية تبسّط الدين وتجعل تعلّمه وقتًا ممتعًا." },
  { label: "نص أساسي (Body)", font: "IBM Plex Sans Arabic 400 · 16px · 1.75", className: "text-base", sample: "تدفع نقدًا عند وصول طلبك، والتوصيل لكل الولايات." },
  { label: "عنوان تمهيدي (Eyebrow)", font: "IBM Plex Sans Arabic 600", className: "text-eyebrow text-gold-deep", sample: "اطلب بثقة" },
  { label: "لمسة خطّية (Accent)", font: "Aref Ruqaa 700 · الشعار اللفظي فقط", className: "font-accent text-3xl leading-relaxed text-gold-deep", sample: ar.brand.slogan },
];

export default async function BrandPage() {
  const product = await getFeaturedProduct();
  return (
    <div className="container-page section space-y-20 md:space-y-28">
      <SectionHeading
        as="h1"
        size="xl"
        eyebrow="دليل الهوية"
        title="هوية مشكاة"
        lead="«المشكاة المضيئة»: حبر دافئ وذهبي المصباح على ورق عاجي، والزيتوني صوتٌ ثانٍ هادئ. الكوّة (النافذة المدبّبة من الشعار) هي توقيعنا البصري، والصور الحقيقية للمنتجات هي البطل دائمًا."
      />

      <section aria-labelledby="palette" className="space-y-12">
        <SectionHeading id="palette" size="md" eyebrow="١" title="لوحة الألوان" />
        {PALETTE.map((group) => (
          <div key={group.title}>
            <h3 className="text-title">{group.title}</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.swatches.map((s) => (
                <li key={s.token} className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
                  <div className={cn("flex h-24 items-end p-4", s.dark ? "text-paper" : "text-ink")} style={{ background: s.hex }}>
                    <span dir="ltr" className="font-semibold tabular">
                      {s.hex}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">
                      {s.name} <code dir="ltr" className="ms-1 rounded bg-sand px-1.5 text-sm text-muted">{s.token}</code>
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">{s.use}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="max-w-3xl rounded-[var(--radius-lg)] bg-sand p-5 leading-8 text-muted">
          النسبة التقريبية في أي صفحة: ٧٠٪ عاجي ورملي، ٢٠٪ حبر، ١٠٪ ذهبي وزيتوني. الذهبي لا يُكتب به نص صغير على خلفية فاتحة (يُستعمل الذهبي العميق)،
          وعلى الزيتوني يُستعمل الذهبي للعناوين الكبيرة والذهبي الفاتح للنصوص الصغيرة.
        </p>
      </section>

      <section aria-labelledby="type" className="space-y-8">
        <SectionHeading id="type" size="md" eyebrow="٢" title="الخطوط" lead="خط عرض هندسي حديث يحاكي الكوفي المربّع في الشعار، وخط نصوص واضح جدًا، ولمسة خطّية واحدة فقط." />
        <ul className="divide-y divide-line border-y border-line">
          {TYPE.map((t) => (
            <li key={t.label} className="grid gap-2 py-6 md:grid-cols-[16rem_1fr] md:gap-8">
              <div>
                <p className="font-semibold">{t.label}</p>
                <p dir="ltr" className="text-end text-sm text-muted md:text-start">
                  {t.font}
                </p>
              </div>
              <p className={t.className}>{t.sample}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="logo" className="space-y-8">
        <SectionHeading id="logo" size="md" eyebrow="٣" title="الشعارات" />
        <div className="grid gap-4 md:grid-cols-3">
          <figure className="grid place-items-center rounded-[var(--radius-lg)] border border-line bg-paper p-10">
            <Logo href={null} className="w-40" />
            <figcaption className="mt-6 text-sm text-muted">الحبر على الخلفيات الفاتحة</figcaption>
          </figure>
          <figure className="on-dark grid place-items-center rounded-[var(--radius-lg)] bg-ink p-10">
            <Logo href={null} tone="gold" className="w-40" />
            <figcaption className="mt-6 text-sm text-paper/70">الذهبي على الحبر والزيتوني والكحلي</figcaption>
          </figure>
          <figure className="on-dark grid place-items-center rounded-[var(--radius-lg)] bg-sabili-navy p-10">
            <Image
              src={BRAND_IMAGES["sabili-yellow"].src}
              alt="شعار سبيلي"
              width={BRAND_IMAGES["sabili-yellow"].width}
              height={BRAND_IMAGES["sabili-yellow"].height}
              className="h-auto w-24"
            />
            <figcaption className="mt-6 text-sm text-paper/70">سبيلي داخل عالمها فقط</figcaption>
          </figure>
        </div>
        <ul className="grid gap-3 leading-8 md:grid-cols-2">
          {[
            "مساحة فارغة حول الشعار تساوي ارتفاع الكوّة داخل الكلمة على الأقل.",
            "أصغر عرض: 96px (لوحة التحكم)، 112px في الهاتف، 128px في الحاسوب.",
            "لا تمديد ولا ضغط ولا تدوير ولا ظلال ولا ألوان غير الحبر والذهبي.",
            "سبيلي منتج من مشكاة: يظهر شعارها في سياقها مع إشارة «من ألعاب مشكاة»، ولا يُدمج الشعاران.",
          ].map((rule) => (
            <li key={rule} className="flex gap-3">
              <NicheMark className="mt-1.5 text-gold-deep" />
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="elements" className="space-y-8">
        <SectionHeading id="elements" size="md" eyebrow="٤" title="العناصر الجرافيكية والمكوّنات" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-6 rounded-[var(--radius-lg)] border border-line bg-surface p-6">
            <h3 className="text-title">الأزرار</h3>
            <div className="flex flex-wrap gap-3">
              <Button>زر رئيسي</Button>
              <Button variant="outline">زر ثانوي</Button>
              <Button variant="gold">ذهبي</Button>
              <Button variant="ghost">نصّي</Button>
            </div>
            <h3 className="text-title">الشارات</h3>
            <div className="flex flex-wrap gap-2">
              <StockBadge stock={20} />
              <StockBadge stock={3} />
              <StockBadge stock={0} />
              <Badge tone="gold">وفّر 19%</Badge>
              <Badge tone="zaytun" icon={CircleCheck}>
                الدفع عند الاستلام
              </Badge>
              <Badge tone="neutral" icon={Sparkles}>
                جديد
              </Badge>
            </div>
            <h3 className="text-title">السعر</h3>
            <Price price={48000} compareAt={59000} size="lg" showSave />
            <h3 className="text-title">الفاصل</h3>
            <Divider />
          </div>
          <div className="on-dark pattern-niche flex flex-col justify-between gap-6 rounded-[var(--radius-lg)] bg-zaytun p-6 text-paper">
            <div>
              <h3 className="text-title text-gold-light">نقش الكوّة</h3>
              <p className="mt-2 leading-8 text-paper/85">
                شبكة من كوّات صغيرة بشفافية منخفضة جدًا، على الأشرطة الداكنة فقط (الحبر، الزيتوني، التذييل). لا تُوضع أبدًا خلف صور المنتجات.
              </p>
            </div>
            <div className="flex items-center gap-4 text-gold">
              <NicheMark filled className="text-4xl" />
              <NicheMark className="text-4xl" />
              <span className="text-paper/80">الكوّة: للعناوين التمهيدية والقوائم والفواصل</span>
            </div>
            <Divider tone="dark" />
            <div className="flex flex-wrap gap-3">
              <Button variant="gold">ذهبي على داكن</Button>
            </div>
          </div>
        </div>
        <ul className="grid gap-3 leading-8 md:grid-cols-2">
          {[
            "الزوايا: 8px للصغير، 12px للأزرار والحقول، 20px للبطاقات، ودائرية للشارات.",
            "الأيقونات: Lucide بسماكة 1.5، بأحجام 20 و24 و28 فقط، بالذهبي العميق على الفاتح والذهبي على الداكن.",
            "إطار الكوّة المدبّب لصور المنتجات فقط، مع خلفية رملية تحت الصورة.",
            "الحركة: مروحة بطاقات سبيلي فقط، وما عداها تغذية راجعة عند التمرير والضغط.",
            "لا مساجد ولا أهلّة ولا زخارف جاهزة ولا تدرّجات للزينة ولا صور مولّدة.",
            "كل قسم يبدأ بعنوان تمهيدي + عنوان + فقرة قصيرة (مكوّن SectionHeading).",
          ].map((rule) => (
            <li key={rule} className="flex gap-3">
              <NicheMark className="mt-1.5 text-gold-deep" />
              {rule}
            </li>
          ))}
        </ul>
        {product ? (
          <div className="max-w-sm">
            <h3 className="text-title mb-5">بطاقة منتج</h3>
            <ProductCard product={product} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
