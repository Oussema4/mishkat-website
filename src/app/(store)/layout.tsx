import { CartHydrator } from "@/components/store/cart-hydrator";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { Toaster } from "@/components/ui/toast";
import { ar } from "@/i18n/ar";
import { getSettings } from "@/server/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <p className="on-dark bg-ink px-4 py-2 text-center text-sm font-medium text-gold-light">{ar.announcement}</p>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} />
      {settings.whatsapp ? <WhatsAppFloat number={settings.whatsapp} /> : null}
      <Toaster />
      <CartHydrator />
    </>
  );
}
