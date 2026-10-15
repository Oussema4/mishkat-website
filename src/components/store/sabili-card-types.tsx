import Image from "next/image";
import { CARD_IMAGES, type CardName } from "@/lib/card-images";

/**
 * "Card types" panel for the Sabili product page, mirroring the printed rules sheet:
 * coloured (easy), yellow (harder), the two win cards, and one real question card.
 */
const CATEGORIES: { label: string; color: CardName; yellow: CardName }[] = [
  { label: "عقيدة", color: "color-aqida", yellow: "yellow-aqida" },
  { label: "قرآن", color: "color-quran", yellow: "yellow-quran" },
  { label: "فقه", color: "color-fiqh", yellow: "yellow-fiqh" },
  { label: "سيرة", color: "color-sira", yellow: "yellow-sira" },
  { label: "تاريخ إسلامي", color: "color-tarikh", yellow: "yellow-tarikh" },
];

function Card({ name, alt, sizes, className }: { name: CardName; alt: string; sizes: string; className?: string }) {
  const img = CARD_IMAGES[name];
  return (
    <Image
      src={img.src}
      alt={alt}
      width={img.width}
      height={img.height}
      sizes={sizes}
      quality={90}
      className={`h-auto w-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.3)] ${className ?? ""}`}
    />
  );
}

export function SabiliCardTypes() {
  return (
    <div className="grid gap-12">
      <div>
        <h3 className="text-2xl text-sabili-yellow">البطاقات الملوّنة: أسئلة سهلة</h3>
        <p className="mt-1 text-paper/75">10 نقاط لكل إجابة صحيحة، و10 ثوانٍ للإجابة.</p>
        <ul className="mt-6 grid max-w-3xl grid-cols-5 gap-2 sm:gap-5">
          {CATEGORIES.map((c) => (
            <li key={c.color} className="text-center">
              <Card name={c.color} alt={`بطاقة ${c.label} الملوّنة`} sizes="(min-width: 768px) 140px, 18vw" />
              <span className="mt-2 block text-sm text-paper/80">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-2xl text-sabili-yellow">البطاقات الصفراء: أسئلة أصعب</h3>
        <p className="mt-1 text-paper/75">30 نقطة لكل إجابة صحيحة، و35 ثانية للإجابة.</p>
        <ul className="mt-6 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-5">
          {CATEGORIES.map((c) => (
            <li key={c.yellow}>
              <Card name={c.yellow} alt={`بطاقة ${c.label} الصفراء`} sizes="(min-width: 640px) 180px, 45vw" />
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h3 className="text-2xl text-sabili-yellow">بطاقات الفوز</h3>
          <p className="mt-1 max-w-md text-paper/75">في نهاية اللعبة يوزّع الفائز على الخاسرين بطاقة «حسنة» أو بطاقة «موعظة».</p>
          <ul className="mt-6 flex max-w-sm gap-4">
            <li className="flex-1">
              <Card name="win-hasana" alt="بطاقة حسنة" sizes="180px" />
            </li>
            <li className="flex-1">
              <Card name="win-mawidha" alt="بطاقة موعظة" sizes="180px" />
            </li>
          </ul>
        </div>
        <figure className="mx-auto w-40 md:w-44">
          <Card name="question-example" alt="مثال لبطاقة سؤال: في أي شهر نزل القرآن الكريم؟ والجواب: رمضان" sizes="176px" className="-rotate-3" />
          <figcaption className="mt-3 text-center text-sm text-paper/75">مثال لبطاقة سؤال</figcaption>
        </figure>
      </div>
    </div>
  );
}
