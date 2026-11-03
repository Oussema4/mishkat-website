"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Flag } from "@/components/brand/flags";
import { useI18n } from "@/i18n/client";
import { LOCALE_INFO, LOCALES, localePath, splitLocale } from "@/i18n/config";
import { cn } from "@/lib/site";

/**
 * Language picker: the current language with its flag; the list opens the same page in another
 * language. `variant="row"` is the labelled version ("Language  [flag English ⌄]") for the footer;
 * the compact one sits in the header.
 */
export function LanguageSwitcher({ variant = "compact", openUp = false }: { variant?: "compact" | "row"; openUp?: boolean }) {
  const { locale, t } = useI18n();
  const { path } = splitLocale(usePathname());
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = LOCALE_INFO[locale];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger = (
    <button
      ref={button}
      type="button"
      aria-haspopup="true"
      aria-expanded={open}
      aria-controls={listId}
      aria-label={`${t.nav.language}: ${current.label}`}
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full text-paper transition-colors",
        variant === "row" ? "border border-paper/20 bg-ink-soft px-4 hover:border-gold/60" : "px-2.5 hover:bg-paper/10",
      )}
    >
      <Flag country={current.flag} />
      <span className={cn("text-sm font-medium", variant === "compact" && "hidden lg:inline")}>{current.label}</span>
      <ChevronDown aria-hidden className={cn("size-4 opacity-70 transition-transform", open && "rotate-180")} />
    </button>
  );

  return (
    <div ref={root} className={cn("relative", variant === "row" && "flex items-center justify-between gap-6")}>
      {variant === "row" ? (
        <span className="inline-flex items-center gap-2 font-medium text-paper/80">
          <Globe aria-hidden className="size-5 text-gold" strokeWidth={1.5} />
          {t.nav.language}
        </span>
      ) : null}
      <div className="relative">
        {trigger}
        <ul
          id={listId}
          hidden={!open}
          className={cn(
            "absolute end-0 z-50 min-w-44 overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-ink-soft py-1 shadow-[var(--shadow-lift)]",
            openUp ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {LOCALES.map((l) => {
            const info = LOCALE_INFO[l];
            const active = l === locale;
            return (
              <li key={l}>
                <a
                  href={localePath(l, path)}
                  hrefLang={info.htmlLang}
                  lang={info.htmlLang}
                  aria-current={active ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 px-4 text-[0.95rem] transition-colors hover:bg-paper/10",
                    active ? "font-semibold text-gold-light" : "text-paper",
                  )}
                >
                  <Flag country={info.flag} />
                  <span className="flex-1">{info.label}</span>
                  {active ? <Check aria-hidden className="size-4" /> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
