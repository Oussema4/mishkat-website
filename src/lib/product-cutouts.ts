/**
 * Product shots cut out of their white studio background (scripts/prepare-assets.mjs: boxCutout),
 * shown on the black store instead of a white rectangle, and the product's 1200×630 share card
 * (`og`, made from the cutout). Keyed by product slug.
 */
export const PRODUCT_CUTOUTS: Record<string, { src: string; width: number; height: number; og?: string }> = {
  sabili: { src: "/images/products/sabili-box-cutout.webp", width: 478, height: 421, og: "/images/og/sabili-og.jpg" },
};
