/**
 * Product shots cut out of their white studio background (scripts/prepare-assets.mjs: boxCutout),
 * shown on the black store instead of a white rectangle, and the product's 1200×630 share card
 * (`og`, made from the cutout). Keyed by product slug.
 */
export const PRODUCT_CUTOUTS: Record<string, { src: string; width: number; height: number; og?: string; replaces: string }> = {
  // `replaces`: the gallery photo (studio shot on white) shown as this cutout on the product page.
  sabili: { src: "/images/products/sabili-box-cutout-v2.webp", width: 1020, height: 917, og: "/images/og/sabili-og.jpg", replaces: "/images/products/sabili-box-v2.webp" },
};

/**
 * A short muted gameplay clip shown first in a product's gallery (4:5, ~12 s, under 1 MB), with a
 * still of its first frame as the poster. Keyed by product slug.
 */
export const PRODUCT_VIDEOS: Record<string, { src: string; poster: string; width: number; height: number }> = {
  sabili: { src: "/videos/sabili-play.mp4", poster: "/images/products/sabili-play-poster.webp", width: 720, height: 900 },
};
