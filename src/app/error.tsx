"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="font-display text-3xl text-ink">This page couldn’t load</h1>
      <p className="text-muted">Reload to try again.</p>
      <button
        type="button"
        onClick={reset}
        className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
      >
        Reload
      </button>
    </div>
  );
}
