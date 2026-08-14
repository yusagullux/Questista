import { Skeleton } from "./components/ui";

/* Root loading boundary — shown while any route segment's server data is in flight. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="text-center mb-8">
        <Skeleton className="h-6 w-32 mx-auto rounded-full mb-4" />
        <Skeleton className="h-9 w-full mx-auto rounded-lg" />
      </div>
      <div className="rounded-[var(--radius)] border bg-surface p-5 shadow-sm mb-10">
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
      </div>
    </div>
  );
}