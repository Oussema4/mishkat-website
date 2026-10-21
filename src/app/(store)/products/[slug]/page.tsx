import type { Metadata } from "next";
import { Check, Presentation, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/store/add-to-cart";
import { FaqList } from "@/components/store/faq-list";
import { ProductGallery } from "@/components/store/product-gallery";
import { buttonClass } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { ar, fill } from "@/i18n/ar";
import { formatTND, fromMillimes } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { getActiveProducts, getProductBySlug } from "@/server/catalog";
import { getSettings } from "@/server/settings";

/**
 * Product pages are pre-built at deploy time and served instantly. New products are built
 * on their first visit; dashboard edits and orders refresh them via revalidatePath.
 */
export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const image = product.images[0]?.url;
  return {
    title: `${product.name}: ${product.tagline}`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.shortDescription, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    stock: product.stock,
    image: product.images[0]?.url ?? "",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => `${siteUrl()}${i.url.startsWith("/") ? i.url : `/${i.url}`}`),
    brand: { "@type": "Brand", name: "Mishkat مشكاة" },
    offers: {
      "@type": "Offer",
      priceCurrency: "TND",
      price: fromMillimes(product.price).toFixed(3),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl()}/products/${product.slug}`,
    },
  };

  const details = [
    product.ageRange ? { label: ar.product.age, value: product.ageRange } : null,
    product.players ? { label: ar.product.players, value: product.players } : null,
  ].filter((d): d is { label: string; value: string } => d !== null);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="مسار التصفح" className="container-page pt-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              {ar.nav.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-ink">
              {ar.nav.shop}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* ───── Purchase area ───── */}
      <section className="container-page grid gap-10 py-8 md:grid-cols-2 md:gap-14 md:py-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="md:pt-6">
          <h1 className="text-5xl md:text-6xl">{product.name}</h1>
          {product.tagline ? <p className="mt-3 text-xl font-medium">{product.tagline}</p> : null}
          <p className="mt-4 max-w-prose leading-8 text-muted">{product.shortDescription}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Price price={product.price} compareAt={product.compareAtPrice} size="lg" showSave />
            <StockBadge stock={product.stock} />
          </div>

          {details.length > 0 ? (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              {details.map((d) => (
                <div key={d.label} className="flex gap-2">
                  <dt className="text-muted">{d.label}:</dt>
                  <dd className="font-semibold">{d.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-8">
            <ProductPurchase product={cartProduct} />
          </div>

          <ul className="mt-8 space-y-3 border-t border-line pt-6 text-[0.95rem]">
            <li className="flex items-center gap-3">
              <Wallet aria-hidden className="size-5 shrink-0 text-gold-deep" strokeWidth={1.5} />
              {ar.checkout.paymentCod}
            </li>
            <li className="flex items-center gap-3">
              <Truck aria-hidden className="size-5 shrink-0 text-gold-deep" strokeWidth={1.5} />
              {fill("توصيل لكل الولايات خلال {time} · {fee}", { time: settings.deliveryTime, fee: formatTND(settings.deliveryFee) })}
            </li>
          </ul>
        </div>
      </section>

      {/* ───── Description + contents ───── */}
      <section className="border-t border-line">
        <div className="container-page grid gap-12 py-14 md:grid-cols-[1.3fr_1fr] md:py-20">
          <div>
            <h2 className="text-3xl">{ar.product.description}</h2>
            <div className="prose-ar mt-5 max-w-prose text-lg leading-9">
              {product.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          {product.contents.length > 0 ? (
            <div>
              <h2 className="text-3xl">{ar.product.contents}</h2>
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {product.contents.map((c) => (
                  <div key={c.label} className="py-4">
                    <dt className="font-semibold">{c.label}</dt>
                    <dd className="mt-1 leading-7 text-muted">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      {/* ───── How to play (a real sequence → numbered) ───── */}
      {product.howToPlay.length > 0 ? (
        <section id="how-to-play" aria-labelledby="how-to-play-title" className="on-dark scroll-mt-24 bg-sabili-navy text-paper">
          <div className="container-page py-16 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 id="how-to-play-title" className="text-3xl md:text-4xl">
                  {ar.product.howToPlay}
                </h2>
                <p className="mt-3 text-paper/70">{ar.product.rulesNote}</p>
              </div>
              {product.slug === "sabili" ? (
                // A static page in public/rules (built by scripts/build-slides.mjs), so a plain <a>, not <Link>.
                <a href="/rules/sabili" className={buttonClass("sabili", "lg")}>
                  <Presentation aria-hidden className="size-5" strokeWidth={1.5} />
                  {ar.product.rulesDeck}
                </a>
              ) : null}
            </div>
            {product.slug === "sabili" ? (
              <div className="mt-12 border-b border-paper/15 pb-14">
                {/* The rules deck itself (public/rules/sabili.html); ?embed hides its "back" link and wheel paging. */}
                <iframe
                  src="/rules/sabili?embed"
                  title={ar.product.rulesDeckTitle}
                  loading="lazy"
                  allow="fullscreen"
                  className="aspect-video w-full rounded-[var(--radius-lg)] bg-[#0b0e2c] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7)]"
                />
              </div>
            ) : null}
            <ol className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {product.howToPlay.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5">
                  <span
                    aria-hidden
                    className="font-display text-4xl leading-none text-sabili-yellow tabular"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 leading-8 text-paper/85">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ───── Benefits + FAQ ───── */}
      <section className="container-page grid gap-14 py-16 md:grid-cols-2 md:py-24">
        {product.benefits.length > 0 ? (
          <div>
            <h2 className="text-3xl">{ar.product.benefits}</h2>
            <ul className="mt-6 space-y-4">
              {product.benefits.map((b) => (
                <li key={b} className="flex gap-3 leading-8">
                  <Check aria-hidden className="mt-1.5 size-5 shrink-0 text-gold-deep" strokeWidth={2.25} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {product.faq.length > 0 ? (
          <div>
            <h2 className="text-3xl">{ar.product.faq}</h2>
            <div className="mt-4">
              <FaqList items={product.faq} />
            </div>
          </div>
        ) : null}
      </section>

      {/* Mobile sticky order bar */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <span className="block text-sm text-muted">{product.name}</span>
            <span className="font-bold tabular">{formatTND(product.price)}</span>
          </div>
          <ProductPurchase product={cartProduct} sticky />
        </div>
      </div>
    </>
  );
}
