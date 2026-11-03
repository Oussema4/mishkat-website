import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";
import { fontClasses } from "../fonts";
import "../globals.css";

/** Root of the dashboard: always Arabic, right to left, never indexed. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar-TN" dir="rtl" className={fontClasses}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
