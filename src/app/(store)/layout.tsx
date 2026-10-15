import { CartHydrator } from "@/components/store/cart-hydrator";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { Toaster } from "@/components/ui/toast";
import { getSettings } from "@/server/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
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
