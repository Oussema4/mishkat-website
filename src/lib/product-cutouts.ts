/**
 * Product shots cut out of their white studio background (scripts/prepare-assets.mjs: boxCutout),
 * shown on the black store instead of a white rectangle, and the product's 1200×630 share card
 * (`og`, made from the cutout). Keyed by product slug.
 */
export const PRODUCT_CUTOUTS: Record<string, { src: string; width: number; height: number; og?: string; replaces: string }> = {
  // `replaces`: the gallery photo (studio shot on white) shown as this cutout on the product page.
  sabili: { src: "/images/products/sabili-box-cutout-v2.webp", width: 1020, height: 917, og: "/images/og/sabili-og.jpg", replaces: "/images/products/sabili-box-v2.webp" },
};
