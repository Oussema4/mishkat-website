import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import { getDictionary, localePath, type Locale } from "@/i18n/config";
import { instagramHandle, whatsappLink } from "@/lib/tunisia";
import type { StoreSettings } from "@/lib/settings-schema";

export function Footer({ settings, locale }: { settings: StoreSettings; locale: Locale }) {
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale, path);
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark bg-ink text-paper">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-8">
        <div className="space-y-4">
          <Logo tone="gold" className="w-36" href={href("/")} locale={locale} />
          <p className="font-display text-xl text-gold">{t.brand.slogan}</p>
          <p className="max-w-xs text-paper/75">{t.brand.mission}</p>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="mb-3 font-sans text-base font-semibold text-gold">
            {t.footer.shop}
          </h2>
          <ul className="space-y-1">
            <FooterLink href={href("/shop")}>{t.nav.shop}</FooterLink>
            <FooterLink href={href("/products/sabili")}>{t.nav.sabili}</FooterLink>
            <FooterLink href={href("/cart")}>{t.nav.cart}</FooterLink>
          </ul>
        </nav>

        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="mb-3 font-sans text-base font-semibold text-gold">
            {t.footer.help}
          </h2>
          <ul className="space-y-1">
            <FooterLink href={href("/faq")}>{t.nav.faq}</FooterLink>
            <FooterLink href={href("/policies/delivery")}>{t.policies.delivery}</FooterLink>
            <FooterLink href={href("/policies/returns")}>{t.policies.returns}</FooterLink>
            <FooterLink href={href("/contact")}>{t.nav.contact}</FooterLink>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-sans text-base font-semibold text-gold">{t.footer.follow}</h2>
          <ul className="space-y-1">
            {settings.whatsapp ? (
              <li>
                <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener" className="footer-link">
                  <WhatsAppIcon className="size-5" />
                  <span>{t.contact.whatsappLabel}</span>
                </a>
              </li>
            ) : null}
            {settings.phone ? (
              <li>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="footer-link">
                  <Phone aria-hidden className="size-5" strokeWidth={1.5} />
                  <span dir="ltr">{settings.phone}</span>
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="footer-link">
                  <Mail aria-hidden className="size-5" strokeWidth={1.5} />
                  <span dir="ltr" className="break-all">
                    {settings.email}
                  </span>
                </a>
              </li>
            ) : null}
            {settings.instagram ? (
              <li>
                <a href={settings.instagram} target="_blank" rel="noopener" className="footer-link">
                  <InstagramIcon className="size-5" />
                  <span dir="ltr">{instagramHandle(settings.instagram)}</span>
                </a>
              </li>
            ) : null}
            {settings.facebook ? (
              <li>
                <a href={settings.facebook} target="_blank" rel="noopener" className="footer-link">
                  <FacebookIcon className="size-5" />
                  <span>{t.contact.facebook}</span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="bg-ink-soft">
        <div className="container-page flex flex-col-reverse gap-4 pb-24 pt-5 sm:flex-row sm:items-center sm:justify-between md:pb-5">
          <p className="text-sm text-paper/60">
            © {year} {t.brand.name}
            {t.brand.name !== t.brand.nameLatin ? ` (${t.brand.nameLatin})` : ""}. {t.footer.rights}
          </p>
          <LanguageSwitcher variant="row" openUp />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="footer-link">
        {children}
      </Link>
    </li>
  );
}
