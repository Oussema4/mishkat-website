"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { useI18n } from "@/i18n/client";
import { splitLocale } from "@/i18n/config";
import { whatsappLink } from "@/lib/tunisia";

/** Floating WhatsApp shortcut. Hidden in checkout/product pages where a sticky action bar lives. */
export function WhatsAppFloat({ number }: { number: string }) {
  const { t } = useI18n();
  const { path } = splitLocale(usePathname());
  if (path.startsWith("/checkout") || path.startsWith("/products/")) return null;
  return (
    <a
      href={whatsappLink(number, t.contact.whatsappMessage)}
      target="_blank"
      rel="noopener"
      aria-label={t.contact.whatsapp}
      className="fixed bottom-5 end-5 z-30 inline-flex size-14 items-center justify-center rounded-full bg-[#1f8f4e] text-paper shadow-[var(--shadow-lift)] transition-transform duration-150 hover:scale-105 active:scale-95"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
