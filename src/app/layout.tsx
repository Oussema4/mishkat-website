import type { Metadata, Viewport } from "next";
import { Aref_Ruqaa, IBM_Plex_Sans_Arabic } from "next/font/google";
import { locales, defaultLocale, t } from "@/i18n/config";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/** Ruqʿah calligraphy for headings — pairs with the geometric Kufic of the Mishkat logo. */
const display = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-calligraphy",
  display: "swap",
});

const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
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
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = locales[defaultLocale];
  return (
    <html lang={locale.lang} dir={locale.dir} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
