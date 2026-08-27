import Link from "next/link";

/** Playful 404 (decision #27, N2): on-brand copy + funnel CTAs. */
export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="material-symbols-outlined text-primary text-6xl" aria-hidden="true">
        surfing
      </span>
      <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface md:text-display-lg md:font-display-lg">
        This page has surfed away
      </h1>
      <p className="text-body-lg text-on-surface-variant max-w-md">
        The link may be broken or the page never existed. Let&apos;s get you back to building your
        setup.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="bg-primary text-on-primary hover:bg-surface-tint focus-visible:outline-primary rounded-xl px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to Home
        </Link>
        <Link
          href="/builder"
          className="border-primary text-primary hover:bg-primary hover:text-on-primary focus-visible:outline-primary rounded-xl border-2 px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Start Building
        </Link>
      </div>
    </div>
  );
}
