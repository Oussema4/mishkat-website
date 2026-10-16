import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { ar } from "@/i18n/ar";
import { instagramHandle, whatsappLink } from "@/lib/tunisia";
import type { StoreSettings } from "@/lib/settings-schema";

export function Footer({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark bg-ink text-paper">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-8">
        <div className="space-y-4">
          <Logo tone="gold" className="w-36" />
          <p className="font-display text-xl text-gold">{ar.brand.slogan}</p>
          <p className="max-w-xs text-paper/75">{ar.brand.mission}</p>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="mb-3 font-sans text-base font-semibold text-gold">
            {ar.footer.shop}
          </h2>
          <ul className="space-y-1">
            <FooterLink href="/shop">{ar.nav.shop}</FooterLink>
            <FooterLink href="/products/sabili">{ar.nav.sabili}</FooterLink>
            <FooterLink href="/cart">{ar.nav.cart}</FooterLink>
          </ul>
        </nav>

        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="mb-3 font-sans text-base font-semibold text-gold">
            {ar.footer.help}
          </h2>
          <ul className="space-y-1">
            <FooterLink href="/faq">{ar.nav.faq}</FooterLink>
            <FooterLink href="/policies/delivery">{ar.policies.delivery}</FooterLink>
            <FooterLink href="/policies/returns">{ar.policies.returns}</FooterLink>
            <FooterLink href="/contact">{ar.nav.contact}</FooterLink>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-sans text-base font-semibold text-gold">{ar.footer.follow}</h2>
          <ul className="space-y-1">
            {settings.whatsapp ? (
              <li>
                <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener" className="footer-link">
                  <WhatsAppIcon className="size-5" />
                  <span>واتساب</span>
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
                  <span>{ar.contact.facebook}</span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <p className="container-page py-5 text-sm text-paper/60">
          © {year} {ar.brand.name} ({ar.brand.nameLatin}). {ar.footer.rights}
        </p>
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
