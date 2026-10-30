"use client";

import type { FormState } from "@/app/admin/actions";

type Kind = "product" | "review";

/**
 * Sends images to /admin/upload one at a time (each request stays under the size limit) and
 * reports the result in the same shape as the dashboard's Server Actions.
 */
export async function uploadImages(
  kind: Kind,
  files: File[],
  fields: Record<string, string>,
  onProgress?: (done: number, total: number) => void,
): Promise<FormState> {
  const images = files.filter((f) => f.size > 0);
  if (images.length === 0) return { error: "اختر صورة." };
  let message: string | undefined;
  for (const [i, file] of images.entries()) {
    onProgress?.(i, images.length);
    const form = new FormData();
    form.set("kind", kind);
    for (const [k, v] of Object.entries(fields)) form.set(k, v);
    form.set("image", file);
    try {
      const res = await fetch("/admin/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as FormState;
      if (!res.ok || !body.ok) {
        const which = images.length > 1 ? ` (الصورة ${i + 1} من ${images.length}: ${file.name})` : "";
        return { error: (body.error ?? "تعذّر رفع الصورة. أعد المحاولة.") + which };
      }
      message = body.message;
    } catch {
      return { error: "تعذّر الاتصال. تحقّق من الإنترنت ثم أعد المحاولة." };
    }
  }
  onProgress?.(images.length, images.length);
  return { ok: true, message: images.length > 1 ? `تمت إضافة ${images.length} صور.` : message };
}

/**
 * A form action (for useActionState) that uploads the form's chosen images (`image`, one or many)
 * with the form's other fields. Call `onDone` to refresh the page.
 */
export function uploadAction(kind: Kind, onDone: () => void) {
  return async (_prev: FormState, form: FormData): Promise<FormState> => {
    const files = form.getAll("image").filter((f): f is File => f instanceof File);
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) if (typeof v === "string") fields[k] = v;
    const result = await uploadImages(kind, files, fields);
    if (result.ok) onDone();
    return result;
  };
}
