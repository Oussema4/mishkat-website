import type { FaqItem } from "@/db/schema";

/** Settings shown to customers in their language; French and English versions live in `translations`. */
export const LOCALIZED_SETTING_KEYS = ["deliveryTime", "policyDelivery", "policyReturns", "faq"] as const;
export type LocalizedSettings = Pick<StoreSettings, (typeof LOCALIZED_SETTING_KEYS)[number]>;

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
  /** French and English versions of the localized fields; a missing field falls back to Arabic. */
  translations: { fr?: Partial<LocalizedSettings>; en?: Partial<LocalizedSettings> };
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
  translations: {
    fr: {
      deliveryTime: "48 heures",
      policyDelivery: [
        "Nous livrons votre commande dans tous les gouvernorats de Tunisie.",
        "Délai de livraison : environ 48 heures après la confirmation de la commande.",
        "Frais de livraison : 8 DT par commande, au même tarif dans tous les gouvernorats.",
        "Paiement à la livraison uniquement : vous payez le livreur à la réception.",
      ].join("\n"),
      faq: [
        { q: "Comment payer ma commande ?", a: "Uniquement en espèces à la livraison. Ni carte bancaire ni paiement à l’avance : vous payez à la réception." },
        { q: "Quel est le délai de livraison ?", a: "Environ 48 heures, et nous livrons dans tous les gouvernorats de Tunisie." },
        { q: "Combien coûte la livraison ?", a: "8 DT par commande, au même tarif dans tous les gouvernorats." },
        { q: "Comment suivre ou modifier ma commande ?", a: "Écrivez-nous sur WhatsApp ou Instagram avec le numéro de commande affiché après la confirmation." },
      ],
    },
    en: {
      deliveryTime: "48 hours",
      policyDelivery: [
        "We deliver your order to every governorate in Tunisia.",
        "Delivery time: about 48 hours after the order is confirmed.",
        "Delivery fee: 8 TND per order, the same price in every governorate.",
        "Cash on delivery only: you pay the courier when your order arrives.",
      ].join("\n"),
      faq: [
        { q: "How do I pay for my order?", a: "Cash on delivery only. No bank card and no advance payment: you pay when your order arrives." },
        { q: "How long does delivery take?", a: "About 48 hours, and we deliver to every governorate in Tunisia." },
        { q: "How much is delivery?", a: "8 TND per order, the same price in every governorate." },
        { q: "How do I follow up on or change my order?", a: "Message us on WhatsApp or Instagram with the order number shown after you confirm." },
      ],
    },
  },
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof StoreSettings)[];
