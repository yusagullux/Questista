import type { Metadata } from "next";

/* Reusable noindex metadata for private/admin/auth routes that should not be
   indexed or cached by search engines. The page itself is still crawlable for
   rendering (robots.txt blocks paths too) — this is defense in depth. */
export const noindex: Metadata = {
  robots: { index: false, follow: false },
};