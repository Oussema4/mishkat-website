import type { NextConfig } from "next";

/**
 * Host of OUR public Vercel Blob store: BLOB_PUBLIC_HOST (set in Vercel, Production), or derived
 * from a classic token (`vercel_blob_rw_<storeId>_…`; newer tokens don't carry it, hence the
 * variable). The image optimizer and the CSP only trust this store, never
 * `*.public.blob.vercel-storage.com` (that would let anyone's store be served through our domain).
 */
function blobHost() {
  if (process.env.BLOB_PUBLIC_HOST) return process.env.BLOB_PUBLIC_HOST.trim().toLowerCase();
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  return storeId ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null;
}
const BLOB_HOST = blobHost();

const DEV = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy: only this site's own scripts, styles, fonts and images, plus Google Fonts
 * (used by the rules deck) and our Blob store. Next.js inlines its bootstrap scripts, hence
 * 'unsafe-inline' for scripts; the dev server also needs eval and a websocket for hot reload.
 * frame-ancestors differs by route: nothing may frame the store, the rules deck only by our pages.
 */
function csp(frameAncestors: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob:${BLOB_HOST ? ` https://${BLOB_HOST}` : ""}`,
    `connect-src 'self'${DEV ? " ws: wss:" : ""}`,
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    ...(DEV ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: BLOB_HOST ? [{ protocol: "https", hostname: BLOB_HOST, pathname: "/mishkat/**" }] : [],
  },
  // Server Actions keep the default 1 MB body limit: image uploads go through /admin/upload instead.
  // Presentations are static pages built into public/rules/ (scripts/build-slides.mjs); serve them without ".html".
  async rewrites() {
    return {
      // Arabic is the store's default language and lives at the root: /shop is served by /ar/shop.
      // French and English keep their prefix (/fr/…, /en/…). Everything that isn't a store page
      // (dashboard, API, files, Next's own assets) is left alone.
      beforeFiles: [
        { source: "/", destination: "/ar" },
        {
          source: "/:path((?!(?:ar|fr|en|admin|api|_next|images|uploads|rules)(?:/|$))(?!.*\\.[a-z0-9]+$).+)",
          destination: "/ar/:path",
        },
      ],
      afterFiles: [{ source: "/rules/:deck", destination: "/rules/:deck.html" }],
      fallback: [],
    };
  },
  async redirects() {
    // One address per page: /ar/… is the same page as the root.
    return [
      { source: "/ar", destination: "/", permanent: true },
      { source: "/ar/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
        ],
      },
      {
        source: "/((?!rules/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp("'none'") },
        ],
      },
      {
        // The rules decks are embedded in our own product page, and nowhere else.
        source: "/rules/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp("'self'") },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // The project's *.vercel.app addresses serve the same pages as www.mishkattn.com: keep them
        // out of Google so the real domain is the only copy it ranks.
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
