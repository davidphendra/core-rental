import Link from "next/link";

/** N1: friendly empty state for /summary with a funnel CTA (decision #23). */
export function EmptyState() {
  return (
    <div className="border-outline-variant bg-surface-container-lowest flex flex-col items-center gap-6 rounded-2xl border p-12 text-center">
      <span className="material-symbols-outlined text-outline text-6xl" aria-hidden="true">
        chair
      </span>
      <div>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">
          Your workspace is empty
        </h2>
        <p className="text-body-lg text-on-surface-variant mt-2">
          Build a setup to see your monthly total and rent it.
        </p>
      </div>
      <Link
        href="/builder"
        className="bg-primary text-on-primary hover:bg-surface-tint focus-visible:outline-primary rounded-xl px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Start building
      </Link>
    </div>
  );
}
