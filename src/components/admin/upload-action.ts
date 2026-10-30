"use client";

import type { FormState } from "@/app/admin/actions";

/**
 * A form action (for useActionState) that sends an upload form to /admin/upload and reports the
 * result in the same shape as the dashboard's Server Actions. Call `onDone` to refresh the page.
 */
export function uploadAction(kind: "product" | "review", onDone: () => void) {
  return async (_prev: FormState, form: FormData): Promise<FormState> => {
    form.set("kind", kind);
    try {
      const res = await fetch("/admin/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as FormState;
      if (!res.ok || !body.ok) return { error: body.error ?? "تعذّر رفع الصورة. أعد المحاولة." };
      onDone();
      return { ok: true, message: body.message };
    } catch {
      return { error: "تعذّر الاتصال. تحقّق من الإنترنت ثم أعد المحاولة." };
    }
  };
}
