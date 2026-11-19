import type { Metadata, Viewport } from "next";
import { RegisterAdminApp } from "@/components/admin/register-app";
import { siteUrl } from "@/lib/site";
import { fontClasses } from "../fonts";
import "../globals.css";

/**
 * Root of the dashboard: always Arabic, right to left, never indexed. It can be installed on a
 * phone as its own app (public/admin.webmanifest; the Android app opens this same address).
 * The manifest sits outside /admin so the phone can read it before anyone is signed in.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  robots: { index: false, follow: false },
  manifest: "/admin.webmanifest",
  icons: { icon: "/images/app/admin-192.png", apple: "/images/app/admin-apple.png" },
  appleWebApp: { capable: true, title: "إدارة مشكاة", statusBarStyle: "black" },
};

export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar-TN" dir="rtl" className={fontClasses}>
      <body className="min-h-dvh">
        {children}
        <RegisterAdminApp />
      </body>
    </html>
  );
}
