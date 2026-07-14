import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-24 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Page not found</h1>
      <p className="mt-4 text-muted">
        That URL is not in the Peptide Protocol catalogue or information pages.
      </p>
      <Link
        href="/shop"
        className="btn-primary mt-8 w-fit rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
      >
        Browse the catalogue
      </Link>
    </div>
  );
}
