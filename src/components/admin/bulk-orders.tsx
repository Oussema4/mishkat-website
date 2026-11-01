"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/** The list's checkboxes join this form through `form="bulk-orders"`. */
export const BULK_FORM = "bulk-orders";

/** Ticked boxes that are on screen (the table and the phone list each render one per order). */
function visibleBoxes() {
  return [...document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${BULK_FORM}"]`)].filter((b) => b.offsetParent !== null);
}

function DeleteButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={count === 0 || pending}
      className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] bg-danger px-4 text-sm font-semibold text-white disabled:opacity-40"
    >
      {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}
      حذف المحدد
    </button>
  );
}

/** Select-all, count and "delete selected" for the orders list (owner only). */
export function BulkOrdersBar({ action }: { action: (form: FormData) => Promise<void> }) {
  const [count, setCount] = useState(0);
  const [all, setAll] = useState(false);

  useEffect(() => {
    const update = () => {
      const boxes = visibleBoxes();
      const ticked = boxes.filter((b) => b.checked).length;
      setCount(ticked);
      setAll(boxes.length > 0 && ticked === boxes.length);
    };
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, []);

  return (
    <form
      id={BULK_FORM}
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(
          `حذف ${count === 1 ? "طلب واحد" : `${count} طلبات`} نهائيًا؟ لا يمكن التراجع.\nكميات الطلبات التي لم تُشحن ترجع إلى المخزون.`,
        );
        if (!ok) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--radius-md)] bg-paper px-4 py-3 shadow-[var(--shadow-soft)]"
    >
      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => {
            for (const b of visibleBoxes()) b.checked = e.target.checked;
            document.dispatchEvent(new Event("change"));
          }}
          className="size-5 accent-ink"
        />
        تحديد كل طلبات الصفحة
      </label>
      <span className="text-sm text-muted tabular" aria-live="polite">
        {count > 0 ? `${count} محدد` : "لم تحدد أي طلب"}
      </span>
      <div className="ms-auto">
        <DeleteButton count={count} />
      </div>
    </form>
  );
}
