"use client";

import { ButtonLink } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/** Inside the store layout (header, footer, language), in the page's language. */
export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <div className="container-page flex min-h-[60dvh] flex-col items-start justify-center gap-6 py-16">
      <h1 className="text-4xl md:text-5xl">{t.notFound.title}</h1>
      <p className="max-w-md text-lg text-muted">{t.notFound.body}</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={href("/shop")}>{t.notFound.shop}</ButtonLink>
        <ButtonLink href={href("/")} variant="outline">
          {t.notFound.home}
        </ButtonLink>
      </div>
    </div>
  );
}
