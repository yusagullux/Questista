"use client";

import { useState } from "react";

export function ShareButton({ answerId }: { answerId: string }) {
  const [label, setLabel] = useState("Share");

  async function share() {
    const url = `${window.location.origin}/#answer-${answerId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Questista", text: "See this perspective on Questista", url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLabel("Copied!");
      setTimeout(() => setLabel("Share"), 1800);
    } catch {
      setLabel(url);
      setTimeout(() => setLabel("Share"), 2500);
    }
  }

  return (
    <button
      onClick={share}
      className="text-xs text-subtle hover:text-foreground transition-colors"
      aria-label="Share"
    >
      {label}
    </button>
  );
}