import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import { locales, defaultLocale, t } from "@/i18n/config";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/** Charter: Reem Kufi for headings — geometric Kufic in tune with the square letters of the logo. */
const display = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-reem-kufi",
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
  themeColor: "#0b0b0b",
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
