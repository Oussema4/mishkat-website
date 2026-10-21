/**
 * Product shots cut out of their white studio background (scripts/prepare-assets.mjs: boxCutout),
 * shown on the black store instead of a white rectangle. Keyed by product slug.
 */
export const PRODUCT_CUTOUTS: Record<string, { src: string; width: number; height: number }> = {
  sabili: { src: "/images/products/sabili-box-cutout.webp", width: 478, height: 421 },
};
