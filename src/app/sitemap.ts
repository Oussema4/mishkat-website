import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getActiveProducts } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getActiveProducts();
  const staticPaths = ["", "/shop", "/faq", "/contact", "/policies/delivery", "/policies/returns"];
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
