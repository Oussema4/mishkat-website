import { Banknote, MessageCircle, Truck, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NicheDivider } from "@/components/brand/niche-divider";
import { CardFan } from "@/components/store/card-fan";
import { FaqList } from "@/components/store/faq-list";
import { ReviewWall } from "@/components/store/review-wall";
import { ButtonLink } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { ar, fill } from "@/i18n/ar";
import { BRAND_IMAGES } from "@/lib/brand-images";
import { formatTND } from "@/lib/money";
import { whatsappLink } from "@/lib/tunisia";
import { getFeaturedProduct, getVisibleReviews } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export default async function HomePage() {
  const [product, reviews, settings] = await Promise.all([getFeaturedProduct(), getVisibleReviews(), getSettings()]);

  const perks = [
    { icon: Wallet, ...ar.home.perks.cod },
    { icon: Truck, title: ar.home.perks.delivery.title, body: fill(ar.home.perks.delivery.body, { time: settings.deliveryTime }) },
    { icon: Banknote, title: fill(ar.home.perks.fee.title, { fee: formatTND(settings.deliveryFee) }), body: ar.home.perks.fee.body },
    { icon: MessageCircle, ...ar.home.perks.support, href: settings.whatsapp ? whatsappLink(settings.whatsapp) : undefined },
  ];

  return (
    <>
      {/* ───── Hero ───── */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-10 md:grid-cols-[1.05fr_1fr] md:gap-14 md:py-20">
          <div className="max-w-xl">
            <h1 id="hero-title" className="text-[2.6rem] sm:text-5xl lg:text-[4.25rem]">
              {ar.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-9 text-muted md:text-xl md:leading-10">{ar.home.heroText}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={product ? `/products/${product.slug}` : "/shop"} size="lg">
                {ar.home.shopNow}
              </ButtonLink>
              <ButtonLink href="/shop" size="lg" variant="outline">
                {ar.home.discover}
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[30rem]">
            <div aria-hidden className="hero-frame niche absolute -inset-2 translate-x-2 translate-y-2 bg-gold/80 md:-inset-4 md:translate-x-3 md:translate-y-3" />
            <div className="hero-rise niche relative aspect-[4/5] overflow-hidden bg-mist">
              <Image
                src="/images/products/sabili-table.webp"
                alt={ar.home.heroImageAlt}
                fill
                priority
                sizes="(min-width: 768px) 480px, 92vw"
                className="object-cover object-[50%_70%]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───── Sabili ───── */}
      {product ? (
        <section aria-labelledby="sabili-title" className="on-dark overflow-hidden bg-sabili-navy text-paper">
          <div className="container-page grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <Image
                src={BRAND_IMAGES["sabili-yellow"].src}
                alt=""
                width={BRAND_IMAGES["sabili-yellow"].width}
                height={BRAND_IMAGES["sabili-yellow"].height}
                quality={90}
                className="mb-6 h-auto w-28"
              />
              <h2 id="sabili-title" className="sr-only">
                {product.name}
              </h2>
              <p className="max-w-md text-xl leading-10 text-paper/90 md:text-2xl md:leading-[2.75rem]">{ar.home.sabiliLead}</p>
              <div className="mt-8">
                <Price price={product.price} compareAt={product.compareAtPrice} tone="dark" size="lg" showSave />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/products/${product.slug}`} variant="sabili" size="lg">
                  {ar.home.sabiliCta}
                </ButtonLink>
                <Link
                  href={`/products/${product.slug}#how-to-play`}
                  className="inline-flex min-h-14 items-center px-2 font-semibold text-paper underline decoration-sabili-yellow decoration-2 underline-offset-8 hover:text-sabili-yellow"
                >
                  {ar.home.sabiliDetails}
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <CardFan />
            </div>
          </div>
        </section>
      ) : null}

      {/* ───── How Mishkat makes learning fun: a Mishkat brand section (black, niche pattern) ───── */}
      <section aria-labelledby="how-title" className="on-dark niche-pattern bg-ink text-paper">
        <div className="container-page py-16 md:py-24">
          <h2 id="how-title" className="max-w-xl text-3xl md:text-4xl">
            {ar.home.howTitle}
          </h2>
          <NicheDivider className="mt-8 max-w-xs" />
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
            {ar.home.howItems.map((item) => (
              <div key={item.title} className="md:border-s md:border-paper/15 md:px-8 md:first:border-s-0 md:first:ps-0">
                <h3 className="text-2xl text-gold">{item.title}</h3>
                <p className="mt-3 leading-8 text-paper/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Why buy from Mishkat ───── */}
      <section aria-labelledby="perks-title" className="bg-mist">
        <div className="container-page py-14 md:py-16">
          <h2 id="perks-title" className="text-2xl md:text-3xl">
            {ar.home.perksTitle}
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, body, ...rest }) => {
              const href = "href" in rest ? rest.href : undefined;
              const content = (
                <>
                  <Icon aria-hidden className="size-7 text-gold-deep" strokeWidth={1.5} />
                  <span className="mt-3 block text-lg font-semibold text-ink">{title}</span>
                  <span className="mt-1 block leading-7 text-muted">{body}</span>
                </>
              );
              return (
                <li key={title}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener" className="block rounded-md hover:[&>span:first-of-type]:underline">
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───── Reviews (real customer messages) ───── */}
      {reviews.length > 0 ? (
        <section aria-labelledby="reviews-title" className="on-dark bg-ink text-paper">
          <div className="container-page py-16 md:py-24">
            <div className="max-w-2xl">
              <h2 id="reviews-title" className="text-3xl text-gold md:text-4xl">
                {ar.home.reviewsTitle}
              </h2>
              <p className="mt-4 text-paper/70">{ar.home.reviewsNote}</p>
            </div>
            <ReviewWall reviews={reviews} />
          </div>
        </section>
      ) : null}

      {/* ───── FAQ ───── */}
      {settings.faq.length > 0 ? (
        <section aria-labelledby="faq-title" className="container-page grid gap-8 py-16 md:grid-cols-[1fr_2fr] md:py-24">
          <div>
            <h2 id="faq-title" className="text-3xl md:text-4xl">
              {ar.home.faqTitle}
            </h2>
            <Link href="/faq" className="mt-4 inline-flex min-h-11 items-center font-semibold text-gold-deep underline underline-offset-4">
              {ar.home.faqMore}
            </Link>
          </div>
          <FaqList items={settings.faq.slice(0, 4)} />
        </section>
      ) : null}
    </>
  );
}
