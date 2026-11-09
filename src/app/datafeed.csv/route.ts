import { siteUrl } from "@/lib/site";
import { getActiveProducts } from "@/server/catalog";

/**
 * Product feed for the Meta catalog (Commerce Manager fetches it on a schedule). One row per active
 * product; `id` is the product id, the same as the Pixel's content_ids, so dynamic ads can match
 * what a visitor viewed. Refreshed hourly.
 */
export const revalidate = 3600;

const COLUMNS = ["id", "title", "description", "availability", "condition", "price", "sale_price", "link", "image_link", "additional_image_link", "brand", "inventory"] as const;

function csvCell(value: string | number) {
  const s = String(value).replace(/\r?\n+/g, " ").trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const tnd = (millimes: number) => `${(millimes / 1000).toFixed(2)} TND`;

export async function GET() {
  const base = siteUrl();
  const products = await getActiveProducts("ar");
  const image = (url: string) => `${base}/api/feed-image?src=${encodeURIComponent(url)}`;

  const rows = products.map((p) => {
    const photos = p.images.map((i) => i.url);
    // A struck-through "compare at" price becomes the regular price, the shop price the sale price.
    const onSale = p.compareAtPrice !== null && p.compareAtPrice > p.price;
    return {
      id: p.id,
      title: p.tagline ? `${p.name} - ${p.tagline}` : p.name,
      description: (p.shortDescription || p.description || p.name).slice(0, 9000),
      availability: p.stock > 0 ? "in stock" : "out of stock",
      condition: "new",
      price: tnd(onSale ? p.compareAtPrice! : p.price),
      sale_price: onSale ? tnd(p.price) : "",
      link: `${base}/products/${p.slug}`,
      image_link: photos[0] ? image(photos[0]) : "",
      additional_image_link: photos.slice(1, 11).map(image).join(","),
      brand: "Mishkat",
      inventory: Math.max(0, p.stock),
    };
  });

  const csv = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\n");
  return new Response(`${csv}\n`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
