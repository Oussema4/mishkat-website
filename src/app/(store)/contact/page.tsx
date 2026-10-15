import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { ar } from "@/i18n/ar";
import { instagramHandle, whatsappLink } from "@/lib/tunisia";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = {
  title: ar.contact.title,
  description: "تواصل مع مشكاة عبر واتساب أو الهاتف أو البريد الإلكتروني أو إنستغرام.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    s.phone && { icon: Phone, label: ar.contact.phone, value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}`, ltr: true },
    s.email && { icon: Mail, label: ar.contact.email, value: s.email, href: `mailto:${s.email}`, ltr: true },
    s.instagram && { icon: InstagramIcon, label: ar.contact.instagram, value: instagramHandle(s.instagram), href: s.instagram, ltr: true, external: true },
    s.facebook && { icon: FacebookIcon, label: ar.contact.facebook, value: "Mishkat", href: s.facebook, ltr: true, external: true },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string; ltr?: boolean; external?: boolean }[];

  return (
    <div className="container-page py-10 md:py-16">
      <div className="max-w-2xl">
        <h1 className="text-display-lg">{ar.contact.title}</h1>
        <p className="mt-3 text-lg text-muted">{ar.contact.lead}</p>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        {s.whatsapp ? (
          <div className="on-dark pattern-niche flex flex-col justify-between gap-8 rounded-[var(--radius-lg)] bg-ink p-8 text-paper">
            <div>
              <WhatsAppIcon className="size-10 text-gold" />
              <p className="text-display-md mt-5 text-gold">{ar.contact.whatsapp}</p>
              <p className="mt-2 text-paper/75">نردّ على أسئلتك قبل الطلب وبعده.</p>
            </div>
            <a
              href={whatsappLink(s.whatsapp, "السلام عليكم، عندي سؤال عن منتجات مشكاة")}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gold px-6 text-lg font-semibold text-ink hover:bg-gold-light"
            >
              <WhatsAppIcon className="size-5" />
              <span dir="ltr" className="tabular">
                {s.phone || s.whatsapp}
              </span>
            </a>
          </div>
        ) : null}

        <ul className="divide-y divide-line border-y border-line">
          {channels.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener" } : {})}
                className="flex min-h-20 items-center gap-4 py-4 hover:[&_.value]:underline"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-light/60"><c.icon aria-hidden className="size-5 text-gold-deep" /></span>
                <span className="flex-1">
                  <span className="block text-sm text-muted">{c.label}</span>
                  <span dir={c.ltr ? "ltr" : undefined} className="value block break-all text-lg font-semibold">
                    {c.value}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 text-muted">
        لديك سؤال عن التوصيل أو الدفع؟ اطّلع على{" "}
        <Link href="/faq" className="font-semibold text-ink underline underline-offset-4">
          {ar.nav.faq}
        </Link>{" "}
        و
        <Link href="/policies/delivery" className="font-semibold text-ink underline underline-offset-4">
          {ar.policies.delivery}
        </Link>
        .
      </p>
    </div>
  );
}
