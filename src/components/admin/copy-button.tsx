"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/site";

/** Small icon button that copies `value` (a phone number…) and shows a tick for a moment. */
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers / no permission: select-and-copy fallback.
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "تنسخ" : label}
      title={copied ? "تنسخ" : label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors hover:bg-mist hover:text-ink",
        copied && "text-success hover:text-success",
        className,
      )}
    >
      {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      <span aria-live="polite" className="sr-only">
        {copied ? "تنسخ" : ""}
      </span>
    </button>
  );
}
