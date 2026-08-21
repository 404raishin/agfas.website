import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start px-5 py-28 sm:px-8">
      <p className="eyebrow">Error · 404</p>
      <h1 className="mt-5 text-4xl sm:text-5xl">This page is not in the catalogue</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-steel">
        The link may be out of date, or the product may have been retired.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="inline-flex h-12 items-center rounded-full bg-solid px-7 text-sm font-medium text-on-solid transition-colors hover:bg-flame-deep"
        >
          Browse detectors
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-medium transition-colors hover:bg-mist"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
