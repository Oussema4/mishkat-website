import { HandHeart, MessageCircleQuestion, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaqList } from "@/components/store/faq-list";
import { KnowledgeMap } from "@/components/store/knowledge-map";
import { ReviewPile } from "@/components/store/review-pile";
import { ReviewWall } from "@/components/store/review-wall";
import { ButtonLink } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";
import { ar, fill } from "@/i18n/ar";
import { PRODUCT_CUTOUTS } from "@/lib/product-cutouts";
import { cn } from "@/lib/site";
import { getActiveProducts, getVisibleReviews } from "@/server/catalog";
import { getSettings } from "@/server/settings";

/*
 * The homepage speaks for Mishkat: a black page lit by the lamp's gold, in Mishkat's colours only
 * (black, charcoal, gold, ivory). Each product keeps its own colours on its own page; here it
 * appears once, recoloured in gold.
 *   hero: the slogan, the light, and the fields of knowledge wired to the Mishkat symbol
 *   →  the name's meaning  →  the catalogue  →  how a Mishkat game teaches
 *   →  what players wrote (messages arriving one by one)  →  questions  →  footer.
 */
export default async function HomePage() {
  const [products, reviews, settings] = await Promise.all([getActiveProducts(), getVisibleReviews(), getSettings()]);

  const beatIcons = [MessageCircleQuestion, TrendingUp, HandHeart];
  const textLink = "inline-flex min-h-12 items-center font-semibold text-gold-light underline decoration-gold decoration-2 underline-offset-8 hover:text-paper";
  const panel = "rounded-3xl border border-paper/10 bg-ink-soft";

  return (
    <div className="on-dark bg-ink text-paper">
      {/* ───── Hero: the slogan in the lamp's light ───── */}
      {/* Pulled up under the translucent header so the light reaches the top of the screen */}
      <section aria-labelledby="hero-title" className="relative isolate -mt-16 overflow-hidden md:-mt-[4.5rem]">
        <div aria-hidden className="lamp-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="container-page pb-20 pt-32 text-center md:pb-28 md:pt-44">
          <h1 id="hero-title" className="mx-auto max-w-4xl text-[2.6rem] leading-[1.3] sm:text-5xl lg:text-[4.25rem]">
            {ar.home.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-paper/80 md:text-xl md:leading-10">{ar.home.heroText}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/shop" variant="gold" size="lg" className="rounded-full px-8">
              {ar.home.shopNow}
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" size="lg" className="px-6 hover:bg-paper/10">
              {ar.home.heroContact}
            </ButtonLink>
          </div>

          <div className="mt-16 md:mt-20">
            <p className="sr-only">
              {ar.home.heroFieldsLabel}: {ar.home.heroFields.join("، ")}
            </p>
            <KnowledgeMap fields={[...ar.home.heroFields]} />
          </div>
        </div>
      </section>

      {/* ───── The name ───── */}
      <section aria-labelledby="about-title" className="container-page grid gap-8 py-20 md:py-32 lg:grid-cols-12">
        <h2 id="about-title" className="text-4xl text-gold-light md:text-5xl lg:col-span-4">
          {ar.home.aboutTitle}
        </h2>
        <Reveal className="lg:col-span-7 lg:col-start-6">
          <p className="text-2xl leading-[1.8] text-paper md:text-[1.75rem]">{ar.home.aboutText}</p>
          <p className="mt-6 text-base text-paper/65">{ar.home.aboutVerse}</p>
        </Reveal>
      </section>

      {/* ───── The catalogue: one picture per product, recoloured in gold; the rest lives on its page ───── */}
      {products.length > 0 ? (
        <section aria-labelledby="products-title" className="container-page pb-20 md:pb-32">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="products-title" className="text-4xl md:text-5xl">
              {ar.home.productsTitle}
            </h2>
            <Link href="/shop" className={textLink}>
              {ar.home.productsAll}
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:mt-12">
            {products.map((p) => {
              // On black, a product shows as a cutout when there is one (its own colours, no white box).
              const cutout = PRODUCT_CUTOUTS[p.slug];
              const cover = cutout ? { ...cutout, cutout: true } : p.images[0] ? { src: p.images[0].url, width: 864, height: 1184, cutout: false } : null;
              return (
                <article key={p.id} aria-labelledby={`product-${p.id}`} className={`${panel} grid items-center gap-8 overflow-hidden p-6 md:grid-cols-12 md:gap-6 md:p-10`}>
                  <Reveal className="md:col-span-6">
                    <h3 id={`product-${p.id}`} className="text-3xl md:text-4xl">
                      {p.name}
                    </h3>
                    <p className="mt-4 max-w-md text-lg leading-8 text-paper/85">{p.shortDescription}</p>
                    <div className="mt-6">
                      <Price price={p.price} compareAt={p.compareAtPrice} tone="dark" size="lg" />
                    </div>
                    <ButtonLink href={`/products/${p.slug}`} variant="gold" size="lg" className="mt-7 rounded-full px-8">
                      {fill(ar.home.productCta, { name: p.name })}
                    </ButtonLink>
                  </Reveal>
                  {cover ? (
                    <Link
                      href={`/products/${p.slug}`}
                      tabIndex={-1}
                      aria-hidden
                      className="group relative isolate grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-ink md:col-span-6"
                    >
                      {/* the lamp's light behind the product, which keeps its own colours */}
                      <span className="absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgb(212_164_64/0.32),transparent)]" />
                      <Image
                        src={cover.src}
                        alt=""
                        width={cover.width}
                        height={cover.height}
                        sizes="(min-width: 768px) 36vw, 80vw"
                        className={cn("h-auto w-[72%] transition-transform duration-700 ease-out group-hover:scale-[1.04]", !cover.cutout && "rounded-xl")}
                      />
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ───── How a Mishkat game teaches ───── */}
      <section aria-labelledby="how-title" className="container-page pb-20 md:pb-32">
        <h2 id="how-title" className="max-w-2xl text-4xl md:text-5xl">
          {ar.home.howTitle}
        </h2>
        <Reveal as="ul" className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3">
          {ar.home.howItems.map((item, i) => {
            const Icon = beatIcons[i];
            return (
              <li key={item.title} className={`${panel} group p-7 transition-colors duration-300 hover:border-gold/40 md:p-8`}>
                <span className="lamp-core grid size-14 place-items-center rounded-2xl border border-gold/30 bg-ink text-gold-light">
                  <Icon aria-hidden className="size-6" strokeWidth={1.5} />
                </span>
                <h3 className="mt-6 font-sans text-xl font-semibold text-gold-light">{item.title}</h3>
                <p className="mt-3 text-lg leading-8 text-paper/80">{item.body}</p>
              </li>
            );
          })}
        </Reveal>
      </section>

      {/* ───── What players wrote: real messages, arriving one at a time on a pile of paper slips ───── */}
      {reviews.length > 0 ? (
        <section aria-labelledby="reviews-title" className="relative isolate overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40rem_26rem_at_20%_50%,rgb(212_164_64/0.14),transparent_70%)]" />
          <div className="container-page grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="reviews-title" className="text-4xl md:text-5xl">
                {ar.home.reviewsTitle}
              </h2>
              <p className="mt-4 max-w-md text-lg leading-8 text-paper/80">{ar.home.reviewsNote}</p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <ReviewPile
                reviews={reviews}
                labels={{ prev: ar.home.reviewsPrev, next: ar.home.reviewsNext, pause: ar.home.reviewsPause, play: ar.home.reviewsPlay }}
              />
            </div>
          </div>
          <div className="container-page pb-20 md:pb-28">
            <ReviewWall reviews={reviews} initial={0} showAllLabel={fill(ar.home.reviewsAll, { count: String(reviews.length) })} />
          </div>
        </section>
      ) : null}

      {/* ───── Questions ───── */}
      {settings.faq.length > 0 ? (
        <section aria-labelledby="faq-title" className="container-page grid gap-8 pb-24 pt-8 md:grid-cols-12 md:pb-32">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-28">
              <h2 id="faq-title" className="text-4xl md:text-5xl">
                {ar.home.faqTitle}
              </h2>
              <Link href="/faq" className={`${textLink} mt-4`}>
                {ar.home.faqMore}
              </Link>
            </div>
          </div>
          <div className="md:col-span-8">
            <FaqList items={settings.faq} tone="dark" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
