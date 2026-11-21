import type { Metadata } from "next";
import { Check, Presentation, Truck, UsersRound, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase, StickyOrderBar } from "@/components/store/add-to-cart";
import { PixelEvent } from "@/components/store/meta-pixel";
import { pixelValue } from "@/lib/meta-pixel";
import { FaqList } from "@/components/store/faq-list";
import { ProductGallery } from "@/components/store/product-gallery";
import { ReviewWall } from "@/components/store/review-wall";
import { buttonClass } from "@/components/ui/button";
import { FrameWhenVisible } from "@/components/ui/in-view";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { fill } from "@/i18n/ar";
import { pageAlternates, pageLocale } from "@/i18n/server";
import { formatTND, fromMillimes } from "@/lib/money";
import { PRODUCT_CUTOUTS } from "@/lib/product-cutouts";
import { siteUrl } from "@/lib/site";
import { getActiveProducts, getProductBySlug, getVisibleReviews } from "@/server/catalog";
import { getSettings } from "@/server/settings";

/**
 * Sabili's page opens its customer messages with the three that answer a buyer's doubts best:
 * a family playing until midnight, three hours without phones, and the quality on arrival.
 * The other visible messages follow behind "read all"; a message hidden in the dashboard stays hidden.
 */
const FEATURED_REVIEWS = ["/images/reviews/review-02-msg.webp", "/images/reviews/review-01-msg.webp", "/images/reviews/review-06.webp"];

/** Two short ones shown right above the order form: three hours without phones, the quality on arrival. */
const NEAR_FORM_REVIEWS = ["/images/reviews/review-01-msg.webp", "/images/reviews/review-06.webp"];

/**
 * Product pages are pre-built at deploy time and served instantly. New products are built
 * on their first visit; dashboard edits and orders refresh them via revalidatePath.
 */
export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, href } = await pageLocale(params);
  const product = await getProductBySlug(slug, locale);
  if (!product) return {};
  const title = product.tagline ? `${product.name}: ${product.tagline}` : product.name;
  // The share card made for the product (1200×630 JPEG), else its first photo.
  const og = PRODUCT_CUTOUTS[product.slug]?.og;
  const image = og ? { url: og, width: 1200, height: 630, alt: product.name } : product.images[0]?.url;
  return {
    title,
    description: product.shortDescription,
    alternates: pageAlternates(locale, `/products/${product.slug}`),
    openGraph: { type: "website", title, description: product.shortDescription, url: href(`/products/${product.slug}`), images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { locale, t, href } = await pageLocale(params);
  const [product, settings, allReviews] = await Promise.all([
    getProductBySlug(slug, locale),
    getSettings(locale),
    getVisibleReviews(),
  ]);
  if (!product) notFound();
  // The customer messages are about Sabili; featured ones first, in the order above.
  const rank = (url: string) => (FEATURED_REVIEWS.includes(url) ? FEATURED_REVIEWS.indexOf(url) : FEATURED_REVIEWS.length);
  const reviews = product.slug === "sabili" ? [...allReviews].sort((a, b) => rank(a.imageUrl) - rank(b.imageUrl)) : [];
  const featuredCount = reviews.filter((r) => FEATURED_REVIEWS.includes(r.imageUrl)).length || 3;
  const nearForm = NEAR_FORM_REVIEWS.flatMap((url) => reviews.filter((r) => r.imageUrl === url));

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    stock: product.stock,
    image: product.images[0]?.url ?? "",
    bundles: product.bundles,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    // Uploaded images are full Blob URLs already; bundled ones are site paths.
    image: product.images.map((i) => (/^https?:\/\//.test(i.url) ? i.url : `${siteUrl()}${i.url.startsWith("/") ? i.url : `/${i.url}`}`)),
    brand: { "@type": "Brand", name: "Mishkat مشكاة" },
    offers: {
      "@type": "Offer",
      priceCurrency: "TND",
      price: fromMillimes(product.price).toFixed(3),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${siteUrl()}${href(`/products/${product.slug}`)}`,
      // Delivery as the shop states it: one flat fee to every governorate, about 48 hours.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: fromMillimes(settings.deliveryFee).toFixed(3), currency: "TND" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "TN" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
        },
      },
    },
  };

  // The age is one of the badges under the price; the players count stays in the details.
  const details = [product.players ? { label: t.product.players, value: product.players } : null].filter(
    (d): d is { label: string; value: string } => d !== null,
  );
  const badges = [
    product.ageRange ? { icon: UsersRound, text: product.ageRange } : null,
    { icon: Wallet, text: t.checkout.paymentCod },
    { icon: Truck, text: fill(t.product.deliveryChip, { time: settings.deliveryTime }) },
  ].filter((b) => b !== null);

  // What's in the box, in a sentence. With messages to show it comes after the form (they take
  // its place before it); otherwise it opens the order column.
  const about = (
    <div className={nearForm.length > 0 ? "mt-8" : "mb-6"}>
      <p className="max-w-prose text-lg leading-8 text-paper/80">{product.shortDescription}</p>

      {details.length > 0 ? (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          {details.map((d) => (
            <div key={d.label} className="flex gap-2">
              <dt className="text-muted">{d.label}:</dt>
              <dd className="font-semibold">{d.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <PixelEvent
        event="ViewContent"
        params={{ content_ids: [String(product.id)], content_type: "product", content_name: product.name, value: pixelValue(product.price) }}
      />

      <nav aria-label={t.nav.breadcrumb} className="container-page pt-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={href("/")} className="hover:text-paper">
              {t.nav.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={href("/shop")} className="hover:text-paper">
              {t.nav.shop}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-paper">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* ───── Purchase area ─────
          Phones: name, price and the key facts first, then the photos, then the order. Wider
          screens: the photos on one side (kept in view), everything else on the other. */}
      <section className="container-page grid gap-6 pt-4 pb-8 md:grid-cols-2 md:gap-x-14 md:gap-y-8 md:py-12">
        <div className="min-w-0 md:col-start-2 md:pt-6">
          <h1 className="text-4xl md:text-6xl">{product.name}</h1>
          {product.tagline ? <p className="mt-2 text-lg font-medium md:mt-3 md:text-xl">{product.tagline}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Price price={product.price} compareAt={product.compareAtPrice} size="lg" showSave locale={locale} />
            <span className="text-sm text-muted tabular">{fill(t.product.deliveryExtra, { fee: formatTND(settings.deliveryFee, locale) })}</span>
            <StockBadge stock={product.stock} locale={locale} />
          </div>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {badges.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5">
                <Icon aria-hidden className="size-4 shrink-0 text-gold-deep" strokeWidth={1.75} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 md:sticky md:top-24 md:col-start-1 md:row-span-2 md:row-start-1 md:self-start">
          <ProductGallery images={product.images} name={product.name} slug={product.slug} />
        </div>

        <div className="min-w-0 md:col-start-2">
          {nearForm.length > 0 ? null : about}
          {/* A couple of real customer messages before the form (all of them further down). */}
          {nearForm.length > 0 ? (
            <section aria-labelledby="near-form-reviews">
              <h2 id="near-form-reviews" className="font-sans text-base font-bold">
                {t.product.reviewsShort}
              </h2>
              <ReviewWall
                reviews={nearForm}
                initial={nearForm.length}
                stack
                labels={{ zoom: t.home.reviewZoom, dialog: t.home.reviewDialog, close: t.common.close }}
              />
              <a href="#product-reviews-title" className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-gold underline-offset-4 hover:underline">
                {fill(t.home.reviewsAll, { count: String(reviews.length) })}
              </a>
            </section>
          ) : null}

          <div className="mt-6">
            <ProductPurchase
              product={cartProduct}
              order={{ deliveryFee: settings.deliveryFee, deliveryTime: settings.deliveryTime }}
              whatsapp={settings.whatsapp || undefined}
            />
          </div>
          {nearForm.length > 0 ? about : null}
        </div>
      </section>

      {/* ───── Real customer messages, right after the order block ───── */}
      {reviews.length > 0 ? (
        <section aria-labelledby="product-reviews-title" className="container-page py-10 md:py-14">
          <h2 id="product-reviews-title" className="scroll-mt-24 text-3xl md:text-4xl">
            {t.home.reviewsTitle}
          </h2>
          <p className="mt-3 max-w-prose text-paper/70">{t.home.reviewsNote}</p>
          <ReviewWall
            reviews={reviews}
            initial={featuredCount}
            labels={{ zoom: t.home.reviewZoom, dialog: t.home.reviewDialog, close: t.common.close }}
            showAllLabel={fill(t.home.reviewsAll, { count: String(reviews.length) })}
          />
        </section>
      ) : null}

      {/* ───── Description + contents ───── */}
      <section>
        <div className="container-page grid gap-12 py-14 md:grid-cols-[1.3fr_1fr] md:py-20">
          <div>
            <h2 className="text-3xl">{t.product.description}</h2>
            <div className="prose-ar mt-5 max-w-prose text-lg leading-9">
              {product.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          {product.contents.length > 0 ? (
            <div>
              <h2 className="text-3xl">{t.product.contents}</h2>
              <dl className="mt-5 grid gap-2">
                {product.contents.map((c) => (
                  <div key={c.label} className="rounded-[var(--radius-md)] bg-mist px-5 py-4">
                    <dt className="font-semibold">{c.label}</dt>
                    <dd className="mt-1 leading-7 text-paper/75">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      {/* ───── How to play (a real sequence → numbered) ───── */}
      {product.howToPlay.length > 0 ? (
        <section id="how-to-play" aria-labelledby="how-to-play-title" className="scroll-mt-24">
          <div className="container-page py-16 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 id="how-to-play-title" className="text-3xl md:text-4xl">
                  {t.product.howToPlay}
                </h2>
                <p className="mt-3 text-paper/70">{t.product.rulesNote}</p>
              </div>
              {product.slug === "sabili" ? (
                // A static page in public/rules (built by scripts/build-slides.mjs), so a plain <a>, not <Link>.
                <a href="/rules/sabili" className={buttonClass("gold", "lg", "rounded-full px-8")}>
                  <Presentation aria-hidden className="size-5" strokeWidth={1.5} />
                  {t.product.rulesDeck}
                </a>
              ) : null}
            </div>
            {product.slug === "sabili" ? (
              <div className="mt-12 pb-6">
                {/* The rules deck itself (public/rules/sabili.html); ?embed hides its "back" link and wheel paging. */}
                <FrameWhenVisible
                  src="/rules/sabili?embed"
                  title={t.product.rulesDeckTitle}
                  className="aspect-video w-full rounded-[var(--radius-lg)] bg-[#0b0e2c]"
                />
              </div>
            ) : null}
            <ol className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {product.howToPlay.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5">
                  <span
                    aria-hidden
                    className="font-display text-4xl leading-none text-gold tabular"
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
            <h2 className="text-3xl">{t.product.benefits}</h2>
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
            <h2 className="text-3xl">{t.product.faq}</h2>
            <div className="mt-4">
              <FaqList items={product.faq} />
            </div>
          </div>
        ) : null}
      </section>

      {/* Mobile sticky order bar (leads to the order form above) */}
      <StickyOrderBar product={cartProduct} deliveryFee={settings.deliveryFee} />
    </>
  );
}
