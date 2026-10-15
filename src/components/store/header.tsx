"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ar, fill } from "@/i18n/ar";
import { cartCount, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/site";

const links = [
  { href: "/", label: ar.nav.home },
  { href: "/shop", label: ar.nav.shop },
  { href: "/products/sabili", label: ar.nav.sabili },
  { href: "/faq", label: ar.nav.faq },
  { href: "/contact", label: ar.nav.contact },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const count = hydrated ? cartCount(lines) : 0;
  const menuButton = useRef<HTMLButtonElement>(null);

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
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {ar.nav.skip}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Logo />

        <nav aria-label="القائمة الرئيسية" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center px-3.5 text-[0.95rem] font-medium transition-colors",
                      active ? "font-semibold text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {l.label}
                    {active ? <span aria-hidden className="absolute inset-x-3.5 bottom-1 h-[3px] rounded-full bg-gold" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/cart"
            className="relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand"
            aria-label={count > 0 ? fill("السلة، فيها {n} قطع", { n: count }) : ar.nav.cart}
          >
            <ShoppingBag aria-hidden className="size-6" strokeWidth={1.75} />
            {count > 0 ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-xs font-bold leading-5 text-ink ring-2 ring-paper tabular"
              >
                {count}
              </span>
            ) : null}
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-sand md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? ar.nav.closeMenu : ar.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="القائمة الرئيسية"
        hidden={!open}
        className="border-t border-line bg-paper md:hidden"
      >
        <ul className="container-page flex flex-col py-2">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center border-s-[3px] ps-4 text-lg",
                    active ? "border-gold font-semibold text-ink" : "border-transparent text-muted",
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
