import type { Metadata } from "next";
import { Search } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { fill } from "@/i18n/ar";
import { pageAlternates, pageLocale, type LangParams } from "@/i18n/server";
import { cn } from "@/lib/site";
import { getActiveProducts, getCategories } from "@/server/catalog";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { locale, t } = await pageLocale(params);
  return { title: t.shop.title, description: t.meta.shop, alternates: pageAlternates(locale, "/shop") };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْ]/g, "")
    .trim();
}

export default async function ShopPage({
  params,
  searchParams,
}: LangParams & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t, href } = await pageLocale(params);
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.slice(0, 80) : "";
  const cat = typeof query.category === "string" ? query.category : "";

  const [all, categories] = await Promise.all([getActiveProducts(locale), getCategories()]);
  const usedCategories = categories.filter((c) => all.some((p) => p.categoryId === c.id));
  const activeCategory = usedCategories.find((c) => c.slug === cat);

  const needle = normalize(q);
  const products = all.filter((p) => {
    if (activeCategory && p.categoryId !== activeCategory.id) return false;
    if (!needle) return true;
    return normalize(`${p.name} ${p.tagline} ${p.shortDescription}`).includes(needle);
  });

  // Search + filters only earn their place once the catalogue grows.
  const showTools = all.length > 3 || Boolean(q);

  return (
    <div className="container-page py-10 md:py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl">{t.shop.title}</h1>
        <p className="mt-3 text-lg text-muted">{t.shop.lead}</p>
      </header>

      {showTools ? (
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form role="search" action={href("/shop")} className="relative w-full md:max-w-sm">
            <label htmlFor="shop-search" className="sr-only">
              {t.shop.search}
            </label>
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input
              id="shop-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t.shop.searchPlaceholder}
              className="h-12 w-full rounded-[var(--radius-md)] border border-line bg-ink-soft ps-10 pe-3 text-base text-paper outline-none placeholder:text-paper/50 focus:border-gold"
            />
            {activeCategory ? <input type="hidden" name="category" value={activeCategory.slug} /> : null}
          </form>
          {usedCategories.length > 1 ? (
            <nav aria-label={t.shop.categories} className="flex flex-wrap gap-2">
              <FilterChip href={href(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop")} active={!activeCategory}>
                {t.shop.all}
              </FilterChip>
              {usedCategories.map((c) => (
                <FilterChip
                  key={c.id}
                  href={href(`/shop?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`)}
                  active={activeCategory?.id === c.id}
                >
                  {c.name}
                </FilterChip>
              ))}
            </nav>
          ) : null}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {fill(t.shop.results, { n: products.length })}
      </p>

      {products.length === 0 ? (
        <div className="mt-12 rounded-[var(--radius-lg)] bg-mist p-10 text-center">
          <p className="text-lg">{t.shop.empty}</p>
          <Link href={href("/shop")} className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
            {t.shop.clear}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i === 0} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-gold bg-gold text-ink" : "border-line text-paper hover:border-gold/60",
      )}
    >
      {children}
    </Link>
  );
}
