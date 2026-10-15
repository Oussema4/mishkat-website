import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/cart", "/checkout", "/order/", "/brand"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
