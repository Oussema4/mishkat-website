"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/form-bits";
import { connectMaystroWebhook, type FormState } from "../../actions";

export function WebhookForm() {
  const [state, action] = useActionState<FormState, FormData>(connectMaystroWebhook, {});
  return (
    <form action={action} className="mt-4 space-y-2">
      <SubmitButton>تسجيل الرابط في Maystro</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
