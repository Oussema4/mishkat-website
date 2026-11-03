import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { CartHydrator } from "@/components/store/cart-hydrator";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "@/i18n/client";
import { getDictionary, isLocale, LOCALE_INFO, LOCALES, type Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/site";
import { getSettings } from "@/server/settings";
import { fontClasses } from "../../fonts";
import "../../globals.css";

/** One store per language: /ar (served at the root), /fr, /en. Anything else is a 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.meta.title, template: `%s | ${t.brand.name}` },
    description: t.meta.description,
    openGraph: {
      type: "website",
      locale: LOCALE_INFO[lang].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => LOCALE_INFO[l].ogLocale),
      siteName: t.brand.name,
      images: [{ url: "/images/og/mishkat-og.jpg", width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    // Google Search Console ownership (HTML tag method): set GOOGLE_SITE_VERIFICATION in Vercel.
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1 };

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const settings = await getSettings(locale);
  const info = LOCALE_INFO[locale];
  return (
    <html lang={info.htmlLang} dir={info.dir} className={fontClasses}>
      <body className="min-h-dvh">
        <LocaleProvider locale={locale}>
          {/* .night: the store's black-and-gold theme (globals.css); .on-dark: gold focus rings */}
          <div className="night on-dark min-h-dvh bg-ink text-paper">
            <Header />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer settings={settings} locale={locale} />
            {settings.whatsapp ? <WhatsAppFloat number={settings.whatsapp} /> : null}
            <Toaster />
            <CartHydrator />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
