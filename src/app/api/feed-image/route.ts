import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/site";

/**
 * JPEG copy of a product photo for the Meta catalog (/datafeed.csv): the site stores WebP, which
 * catalog crawlers don't reliably accept. Only the site's own product images and our Blob store
 * are served, never an arbitrary URL. Cached for a day.
 */
const BLOB_HOST = process.env.BLOB_PUBLIC_HOST?.trim().toLowerCase();

function allowedSource(src: string): string | null {
  if (/^\/images\/products\/[\w.-]+\.(webp|png|jpe?g)$/i.test(src)) return `${siteUrl()}${src}`;
  try {
    const u = new URL(src);
    if (u.protocol === "https:" && BLOB_HOST && u.hostname === BLOB_HOST) return u.toString();
  } catch {
    /* not a URL */
  }
  return null;
}

export async function GET(request: NextRequest) {
  const src = allowedSource(request.nextUrl.searchParams.get("src") ?? "");
  if (!src) return new NextResponse(null, { status: 404 });
  const res = await fetch(src, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  // White background (Meta's catalog style), at most 1200 px, flattened to JPEG.
  const jpeg = await sharp(Buffer.from(await res.arrayBuffer()), { limitInputPixels: 40_000_000 })
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return new NextResponse(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
