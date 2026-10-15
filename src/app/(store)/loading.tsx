/**
 * Shown instantly while a store page is being fetched, so a click never feels frozen.
 * Kept deliberately quiet: a page-shaped placeholder, no spinner.
 */
export default function StoreLoading() {
  return (
    <div role="status" aria-live="polite" className="container-page py-10 md:py-16">
      <span className="sr-only">جارٍ التحميل…</span>
      <div aria-hidden className="animate-pulse space-y-6">
        <div className="h-12 w-2/3 max-w-md rounded-[var(--radius-md)] bg-sand" />
        <div className="h-5 w-full max-w-xl rounded-[var(--radius-sm)] bg-sand" />
        <div className="h-5 w-5/6 max-w-lg rounded-[var(--radius-sm)] bg-sand" />
        <div className="grid gap-8 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="niche-sm aspect-[4/5] bg-sand" />
          <div className="niche-sm hidden aspect-[4/5] bg-sand sm:block" />
          <div className="niche-sm hidden aspect-[4/5] bg-sand lg:block" />
        </div>
      </div>
    </div>
  );
}
