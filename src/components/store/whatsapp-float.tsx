"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { whatsappLink } from "@/lib/tunisia";

/** Floating WhatsApp shortcut. Hidden in checkout/product pages where a sticky action bar lives. */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout") || pathname.startsWith("/products/")) return null;
  return (
    <a
      href={whatsappLink(number, "السلام عليكم، عندي سؤال عن منتجات مشكاة")}
      target="_blank"
      rel="noopener"
      aria-label="راسلنا على واتساب"
      className="fixed bottom-5 end-5 z-30 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-paper shadow-[var(--shadow-lift)] transition-transform duration-150 hover:scale-105 active:scale-95"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
