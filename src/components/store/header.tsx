"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/ar";
import { splitLocale } from "@/i18n/config";
import { cartCount, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/site";

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function Header() {
  const { locale, t, href } = useI18n();
  const pathname = usePathname();
  const { path } = splitLocale(pathname);
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/products/sabili", label: t.nav.sabili },
    { href: "/faq", label: t.nav.faq },
    { href: "/contact", label: t.nav.contact },
  ];
  const [open, setOpen] = useState(false);
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const count = hydrated ? cartCount(lines) : 0;
  const menuButton = useRef<HTMLButtonElement>(null);
  // A black bar; on the homepage it is clear over the hero's light and darkens once the page
  // scrolls under it.
  const home = path === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!home) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={cn(
        "on-dark sticky top-0 z-40 text-paper transition-colors duration-300",
        !home || scrolled || open ? "bg-ink/85 backdrop-blur-md" : "bg-transparent",
      )}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {t.nav.skip}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Logo tone="gold" href={href("/")} locale={locale} />

        <nav aria-label={t.nav.mainMenu} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => {
              const active = isActive(path, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={href(l.href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center whitespace-nowrap px-3 text-[0.95rem] font-medium transition-colors",
                      active ? "text-paper" : "text-paper/65 hover:text-paper",
                    )}
                  >
                    {l.label}
                    {active ? <span aria-hidden className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-gold" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Link
            href={href("/cart")}
            className="relative inline-flex size-11 items-center justify-center rounded-full text-paper transition-colors hover:bg-paper/10"
            aria-label={count > 0 ? fill(t.nav.cartCount, { n: count }) : t.nav.cart}
          >
            <ShoppingBag aria-hidden className="size-6" strokeWidth={1.5} />
            {count > 0 ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-xs font-bold leading-5 text-ink tabular"
              >
                {count}
              </span>
            ) : null}
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-paper/10 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label={t.nav.mainMenu}
        hidden={!open}
        className="bg-ink-soft md:hidden"
      >
        <ul className="container-page flex flex-col py-2">
          {links.map((l) => {
            const active = isActive(path, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={href(l.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center border-s-2 ps-3 text-lg",
                    active ? "border-gold font-semibold text-paper" : "border-transparent text-paper/65",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
