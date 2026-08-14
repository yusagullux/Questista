"use client";

import { useEffect } from "react";
import { Button } from "./components/ui";

/* Root error boundary — catches render errors in any segment, lets the user recover. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the console for debugging; never sent to the client as text.
    console.error("Route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-5xl mb-4" aria-hidden>
        🫧
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2">
        Something went sideways
      </h1>
      <p className="text-muted text-sm mb-6">
        We hit an unexpected snag loading this page. You can try again — your
        work is safe.
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button as="a" href="/" variant="outline">
          Back to today
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-subtle font-mono">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}