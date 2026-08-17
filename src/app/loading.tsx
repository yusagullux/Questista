import { Skeleton } from "./components/ui";

/* Root loading boundary — shown while any route segment's server data is in flight. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {/* Masthead rule */}
      <Skeleton className="h-6 w-full mb-7" />
      {/* Headline */}
      <Skeleton className="h-3 w-28 mb-3" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-4/5 mb-5" />
      <Skeleton className="h-px w-16 mb-8" />
      {/* Composer / status panel */}
      <div className="rounded-[var(--radius)] border border-border bg-surface p-5 mb-10">
        <Skeleton className="h-28 w-full rounded-[var(--radius-sm)]" />
      </div>
      {/* Feed */}
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
      </div>
    </div>
  );
}