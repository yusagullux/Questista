import { Skeleton } from "../../components/ui";

/* Profile-shaped skeleton — avatar card + stat row + answer list. */
export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading profile…</span>
      <div className="rounded-[var(--radius)] border bg-surface p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-6">
          <Skeleton className="h-16 rounded-[var(--radius-sm)]" />
          <Skeleton className="h-16 rounded-[var(--radius-sm)]" />
          <Skeleton className="h-16 rounded-[var(--radius-sm)]" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-[var(--radius)]" />
        <Skeleton className="h-20 rounded-[var(--radius)]" />
      </div>
    </div>
  );
}