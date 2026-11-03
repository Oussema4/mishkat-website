import type { Metadata } from "next";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import { pageAlternates, pageLocale } from "@/i18n/server";
import { getSettings } from "@/server/settings";

const POLICIES = {
  delivery: { title: "delivery", key: "policyDelivery" },
  returns: { title: "returns", key: "policyReturns" },
} as const;

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t } = await pageLocale(params);
  const policy = POLICIES[slug as keyof typeof POLICIES];
  if (!policy) return {};
  // Each policy describes itself with the start of its own text (not the site-wide description,
  // which Google would see as duplicated on every page).
  const text = (await getSettings(locale))[policy.key].replace(/\s+/g, " ").trim();
  const description = text ? (text.length > 155 ? `${text.slice(0, 152).replace(/\s+\S*$/, "")}…` : text) : undefined;
  return { title: t.policies[policy.title], description, alternates: pageAlternates(locale, `/policies/${slug}`) };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const { locale, t } = await pageLocale(params);
  const policy = POLICIES[slug as keyof typeof POLICIES];
  if (!policy) notFound();
  const settings = await getSettings(locale);
  const text = settings[policy.key].trim();

  return (
    <div className="container-page max-w-3xl py-10 md:py-16">
      <h1 className="text-4xl md:text-5xl">{t.policies[policy.title]}</h1>
      {text ? (
        <div className="prose-ar mt-8 text-lg leading-9">
          {text.split(/\n+/).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="mt-8 flex gap-3 rounded-[var(--radius-md)] bg-warning-bg p-5 text-warning">
          <Info aria-hidden className="mt-1 size-5 shrink-0" />
          {t.policies.pending}
        </p>
      )}
    </div>
  );
}
