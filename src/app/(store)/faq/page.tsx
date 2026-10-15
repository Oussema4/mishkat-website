import type { Metadata } from "next";
import { FaqList } from "@/components/store/faq-list";
import { ar } from "@/i18n/ar";
import { getProductBySlug } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = {
  title: ar.nav.faq,
  description: "أجوبة عن الطلب والدفع عند الاستلام والتوصيل ولعبة سبيلي.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [settings, sabili] = await Promise.all([getSettings(), getProductBySlug("sabili")]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...settings.faq, ...(sabili?.faq ?? [])].map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <div className="container-page max-w-3xl py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="text-display-lg">{ar.nav.faq}</h1>
      <section aria-labelledby="faq-order" className="mt-10">
        <h2 id="faq-order" className="text-display-md mb-4">
          الطلب والتوصيل
        </h2>
        <FaqList items={settings.faq} />
      </section>
      {sabili && sabili.faq.length > 0 ? (
        <section aria-labelledby="faq-sabili" className="mt-14">
          <h2 id="faq-sabili" className="text-display-md mb-4">
            لعبة سبيلي
          </h2>
          <FaqList items={sabili.faq} />
        </section>
      ) : null}
    </div>
  );
}
