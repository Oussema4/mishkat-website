import type { Metadata, Viewport } from "next";
import { Alexandria, Aref_Ruqaa, IBM_Plex_Sans_Arabic } from "next/font/google";
import { locales, defaultLocale, t } from "@/i18n/config";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/** Display: geometric modern Arabic that echoes the square Kufic of the Mishkat and Sabili wordmarks. */
const display = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

/** Text and UI: the most legible Arabic sans at 14–18px. */
const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/** Accent only (the slogan). Not preloaded: it appears below the fold. */
const accent = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["700"],
  variable: "--font-ruqaa",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${t.brand.name} | ألعاب تعليمية إسلامية في تونس`,
    template: `%s | ${t.brand.name}`,
  },
  description:
    "مشكاة تصنع ألعابًا تعليمية إسلامية تبسّط الدين وتجعل تعلّمه ممتعًا. اطلب لعبة سبيلي مع توصيل لكل ولايات تونس والدفع عند الاستلام.",
  openGraph: {
    type: "website",
    locale: "ar_TN",
    siteName: t.brand.name,
    images: [{ url: "/images/og/mishkat-og.jpg", width: 1200, height: 630, alt: "لعبة سبيلي من مشكاة" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#17140f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = locales[defaultLocale];
  return (
    <html lang={locale.lang} dir={locale.dir} className={`${display.variable} ${body.variable} ${accent.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
