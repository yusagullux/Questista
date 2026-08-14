import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-5xl mb-4" aria-hidden>
        🔭
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2">
        No one by that name
      </h1>
      <p className="text-muted text-sm mb-6">
        This profile doesn't exist, or the username changed. Maybe try today's
        question instead.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-[var(--radius-sm)] bg-primary text-white text-sm font-medium px-5 py-3 hover:bg-primary-hover transition-colors"
      >
        Back to Questista
      </Link>
    </div>
  );
}