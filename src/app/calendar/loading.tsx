import { Skeleton } from "../components/ui";

/* Calendar-shaped skeleton — level card + history list. */
export default function CalendarLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your calendar…</span>
      <Skeleton className="h-6 w-full mb-5" />
      <Skeleton className="h-9 w-44 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <Skeleton className="h-24 w-full rounded-[var(--radius)] mb-6" />
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-[var(--radius)]" />
        <Skeleton className="h-20 rounded-[var(--radius)]" />
        <Skeleton className="h-20 rounded-[var(--radius)]" />
      </div>
    </div>
  );
}