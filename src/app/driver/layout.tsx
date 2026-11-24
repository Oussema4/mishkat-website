import type { Metadata, Viewport } from "next";
import { RegisterAdminApp } from "@/components/admin/register-app";
import { siteUrl } from "@/lib/site";
import { fontClasses } from "../fonts";
import "../globals.css";

/**
 * The driver app: a delivery person sees only the orders given to him and marks each one
 * delivered, no answer, or cancelled. Arabic, never indexed, installable on its own
 * (public/driver.webmanifest; the Android app opens this same address).
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "موزّع مشكاة", template: "%s | موزّع مشكاة" },
  robots: { index: false, follow: false },
  manifest: "/driver.webmanifest",
  icons: { icon: "/images/app/driver-192.png", apple: "/images/app/driver-apple.png" },
  appleWebApp: { capable: true, title: "موزّع مشكاة", statusBarStyle: "black" },
};

export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1 };

export default function DriverRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar-TN" dir="rtl" className={fontClasses}>
      <body className="min-h-dvh bg-mist">
        {children}
        <RegisterAdminApp sw="/driver-sw.js" scope="/driver" />
      </body>
    </html>
  );
}
