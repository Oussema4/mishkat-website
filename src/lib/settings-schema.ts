import type { FaqItem } from "@/db/schema";

/** Editable store settings (stored as key/value JSON in the `settings` table). */
export type StoreSettings = {
  deliveryFee: number; // millimes
  deliveryTime: string;
  whatsapp: string; // digits, local or international
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  policyDelivery: string;
  policyReturns: string;
  faq: FaqItem[];
};

export const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 8000,
  deliveryTime: "48 ساعة",
  whatsapp: "21692359349",
  phone: "+216 92 359 349",
  email: "mishkat0tn@gmail.com",
  instagram: "https://www.instagram.com/mishkat.2025/",
  facebook: "",
  policyDelivery: [
    "نوصّل طلبك إلى كل ولايات الجمهورية التونسية.",
    "مدة التوصيل: 48 ساعة تقريبًا من تأكيد الطلب.",
    "مصاريف التوصيل: 8 د.ت لكل طلب، بنفس السعر في كل الولايات.",
    "الدفع نقدًا عند الاستلام فقط، تدفع ثمن الطلب للموزّع عند وصوله إليك.",
  ].join("\n"),
  policyReturns: "",
  faq: [
    {
      q: "كيف أدفع ثمن الطلب؟",
      a: "الدفع نقدًا عند الاستلام فقط. لا نطلب أي بطاقة بنكية ولا دفعًا مسبقًا، تدفع عند وصول الطلب إليك.",
    },
    {
      q: "كم تستغرق مدة التوصيل؟",
      a: "حوالي 48 ساعة، ونوصّل إلى كل ولايات تونس.",
    },
    {
      q: "كم مصاريف التوصيل؟",
      a: "8 د.ت لكل طلب، بنفس السعر في كل الولايات.",
    },
    {
      q: "كيف أتابع طلبي أو أعدّله؟",
      a: "راسلنا على واتساب أو إنستغرام مع رقم طلبك الذي يظهر بعد تأكيد الطلب.",
    },
  ],
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof StoreSettings)[];
