import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-surface/50">
      <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-subtle">
        <p>
          One question a day.{" "}
          <span className="text-muted">Many perspectives.</span>
        </p>
        <nav className="flex items-center gap-4" aria-label="Footer">
          <Link href="/" className="hover:text-foreground transition-colors">
            Today
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">
            Join
          </Link>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Powered by Supabase
          </a>
        </nav>
      </div>
    </footer>
  );
}