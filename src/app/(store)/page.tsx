import { Banknote, MessageCircle, Truck, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NicheMark } from "@/components/brand/niche-mark";
import { CardFan } from "@/components/store/card-fan";
import { FaqList } from "@/components/store/faq-list";
import { ReviewWall } from "@/components/store/review-wall";
import { ButtonLink } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
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
        <div className="container-page grid items-center gap-12 py-12 md:grid-cols-[1.05fr_1fr] md:gap-14 md:py-20">
          <div className="max-w-xl">
            <SectionHeading as="h1" id="hero-title" size="xl" eyebrow={ar.home.heroEyebrow} title={ar.home.heroTitle} className="max-w-xl" />
            <p className="text-body-lg mt-6 max-w-[34rem] text-muted md:text-xl md:leading-10">{ar.home.heroText}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={product ? `/products/${product.slug}` : "/shop"} size="lg">
                {ar.home.shopNow}
              </ButtonLink>
              <ButtonLink href="/shop" size="lg" variant="outline">
                {ar.home.discover}
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem] text-muted">
              <li className="flex items-center gap-2">
                <Wallet aria-hidden className="size-5 text-gold-deep" strokeWidth={1.5} />
                {ar.home.perks.cod.title}
              </li>
              <li className="flex items-center gap-2">
                <Truck aria-hidden className="size-5 text-gold-deep" strokeWidth={1.5} />
                {ar.home.perks.delivery.title}
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[30rem]">
            <div aria-hidden className="niche absolute -inset-2 translate-x-2 translate-y-2 bg-gold md:-inset-4 md:translate-x-3 md:translate-y-3" />
            <div className="niche relative aspect-[4/5] overflow-hidden bg-sand">
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

      {/* ───── Sabili (the product's own world: navy + card yellow) ───── */}
      {product ? (
        <section aria-labelledby="sabili-title" className="on-dark overflow-hidden bg-sabili-navy text-paper">
          <div className="container-page section grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <p className="text-eyebrow mb-5 flex items-center gap-2 text-sabili-yellow">
                <NicheMark />
                {ar.home.sabiliEyebrow}
              </p>
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

      {/* ───── How Mishkat makes learning fun ───── */}
      <section aria-labelledby="how-title" className="on-dark pattern-niche bg-zaytun text-paper">
        <div className="container-page section">
          <SectionHeading id="how-title" tone="zaytun" eyebrow={ar.home.howEyebrow} title={ar.home.howTitle} />
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {ar.home.howItems.map((item) => (
              <li key={item.title} className="border-t border-paper/20 pt-6">
                <NicheMark filled className="text-2xl text-gold" />
                <h3 className="text-title mt-4 text-gold-light">{item.title}</h3>
                <p className="mt-3 leading-8 text-paper/85">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── Why buy from Mishkat ───── */}
      <section aria-labelledby="perks-title" className="bg-sand">
        <div className="container-page py-14 md:py-20">
          <SectionHeading id="perks-title" size="md" eyebrow={ar.home.perksEyebrow} title={ar.home.perksTitle} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, body, ...rest }) => {
              const href = "href" in rest ? rest.href : undefined;
              const content = (
                <>
                  <span className="grid size-12 place-items-center rounded-full bg-gold-light/60">
                    <Icon aria-hidden className="size-6 text-gold-deep" strokeWidth={1.5} />
                  </span>
                  <span className="mt-4 block font-display text-lg font-semibold leading-snug text-ink">{title}</span>
                  <span className="mt-1 block leading-7 text-muted">{body}</span>
                </>
              );
              const card = "block h-full rounded-[var(--radius-lg)] border border-line bg-surface p-6";
              return (
                <li key={title}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener"
                      className={`${card} transition-[border-color,box-shadow] duration-150 hover:border-gold hover:shadow-[var(--shadow-soft)]`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className={card}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───── Reviews (real customer messages) ───── */}
      {reviews.length > 0 ? (
        <section aria-labelledby="reviews-title" className="on-dark pattern-niche bg-ink text-paper">
          <div className="container-page section">
            <SectionHeading
              id="reviews-title"
              tone="dark"
              eyebrow={ar.home.reviewsEyebrow}
              title={ar.home.reviewsTitle}
              lead={ar.home.reviewsNote}
              titleClassName="text-gold"
            />
            <ReviewWall reviews={reviews} />
          </div>
        </section>
      ) : null}

      {/* ───── FAQ ───── */}
      {settings.faq.length > 0 ? (
        <section aria-labelledby="faq-title" className="container-page section grid gap-8 md:grid-cols-[1fr_2fr] md:gap-12">
          <div>
            <SectionHeading id="faq-title" eyebrow={ar.home.faqEyebrow} title={ar.home.faqTitle} />
            <Link href="/faq" className="mt-4 inline-flex min-h-11 items-center font-semibold text-gold-deep underline underline-offset-4 hover:text-ink">
              {ar.home.faqMore}
            </Link>
          </div>
          <FaqList items={settings.faq.slice(0, 4)} />
        </section>
      ) : null}
    </>
  );
}
