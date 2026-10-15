import type { Metadata } from "next";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import { ar } from "@/i18n/ar";
import { getSettings } from "@/server/settings";

const POLICIES = {
  delivery: { title: ar.policies.delivery, key: "policyDelivery" },
  returns: { title: ar.policies.returns, key: "policyReturns" },
} as const;

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug as keyof typeof POLICIES];
  return policy ? { title: policy.title, alternates: { canonical: `/policies/${slug}` } } : {};
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = POLICIES[slug as keyof typeof POLICIES];
  if (!policy) notFound();
  const settings = await getSettings();
  const text = settings[policy.key].trim();

  return (
    <div className="container-page max-w-3xl py-10 md:py-16">
      <h1 className="text-4xl md:text-5xl">{policy.title}</h1>
      {text ? (
        <div className="prose-ar mt-8 text-lg leading-9">
          {text.split(/\n+/).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="mt-8 flex gap-3 rounded-[var(--radius-md)] bg-warning-bg p-5 text-warning">
          <Info aria-hidden className="mt-1 size-5 shrink-0" />
          {ar.policies.pending}
        </p>
      )}
    </div>
  );
}
