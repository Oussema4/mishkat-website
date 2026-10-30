import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import sharp, { type OutputInfo } from "sharp";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult = { ok: true; url: string; width: number; height: number } | { ok: false; error: string };

/**
 * Validates and optimizes an uploaded image (→ WebP, max 1600px), then stores it in
 * Vercel Blob in production or public/uploads locally.
 */
export async function saveImage(file: File, folder: "products" | "reviews"): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: "لم يتم اختيار صورة." };
  if (file.size > MAX_BYTES) return { ok: false, error: "حجم الصورة أكبر من 6 ميغابايت." };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: "الصيغ المقبولة: JPG أو PNG أو WebP." };

  let output: { data: Buffer; info: OutputInfo };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    // limitInputPixels: refuse decompression bombs (a tiny file that decodes to a gigantic image).
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, error: "تعذّرت قراءة الصورة. جرّب صورة أخرى." };
  }

  const name = `${folder}/${Date.now()}-${randomBytes(5).toString("hex")}.webp`;

  // The token is passed explicitly: with OIDC on Vercel, @vercel/blob would otherwise prefer the
  // store named by BLOB_STORE_ID, which can be a different (private) store.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(`mishkat/${name}`, output.data, { access: "public", contentType: "image/webp", token });
    return { ok: true, url: blob.url, width: output.info.width, height: output.info.height };
  }

  if (process.env.VERCEL) {
    return { ok: false, error: "رفع الصور غير مفعّل: اربط Vercel Blob بالمشروع (راجع README)." };
  }
  const target = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, output.data);
  return { ok: true, url: `/uploads/${name}`, width: output.info.width, height: output.info.height };
}

/** Deletes an image previously stored by saveImage. Bundled images (/images/...) are never deleted. */
export async function deleteImage(url: string) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (url.includes(".blob.vercel-storage.com") && token) {
      await del(url, { token });
    } else if (url.startsWith("/uploads/")) {
      const target = path.join(process.cwd(), "public", url);
      if (target.startsWith(path.join(process.cwd(), "public", "uploads"))) await unlink(target);
    }
  } catch {
    // Missing file is fine — the database row is what matters.
  }
}
