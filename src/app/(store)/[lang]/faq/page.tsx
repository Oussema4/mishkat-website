import type { Metadata } from "next";
import { FaqList } from "@/components/store/faq-list";
import { pageAlternates, pageLocale, type LangParams } from "@/i18n/server";
import { getProductBySlug } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { locale, t } = await pageLocale(params);
  return { title: t.nav.faq, description: t.meta.faq, alternates: pageAlternates(locale, "/faq") };
}

export default async function FaqPage({ params }: LangParams) {
  const { locale, t } = await pageLocale(params);
  const [settings, sabili] = await Promise.all([getSettings(locale), getProductBySlug("sabili", locale)]);
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
      <h1 className="text-4xl md:text-5xl">{t.nav.faq}</h1>
      <section aria-labelledby="faq-order" className="mt-10">
        <h2 id="faq-order" className="mb-4 text-2xl">
          {t.faq.orderSection}
        </h2>
        <FaqList items={settings.faq} />
      </section>
      {sabili && sabili.faq.length > 0 ? (
        <section aria-labelledby="faq-sabili" className="mt-14">
          <h2 id="faq-sabili" className="mb-4 text-2xl">
            {sabili.name}
          </h2>
          <FaqList items={sabili.faq} />
        </section>
      ) : null}
    </div>
  );
}
