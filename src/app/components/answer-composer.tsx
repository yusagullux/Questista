"use client";

import { useState } from "react";
import { Button, Spinner } from "./ui";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

type Visibility = "public" | "private" | "skipped";

export function AnswerComposer({
  question,
  existing,
}: {
  question: Question;
  existing?: { id: string; visibility: Visibility; content: string | null } | null;
}) {
  const [content, setContent] = useState(existing?.content ?? "");
  const [visibility, setVisibility] = useState<Visibility>(existing?.visibility ?? "private");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Visibility | null>(null);

  const isPublic = visibility === "public";

  async function submit(choice: Visibility) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: question.id,
        content: choice === "skipped" ? "" : content.trim(),
        visibility: choice,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    setDone(choice);
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius)] border bg-surface p-8 text-center animate-pop">
        <div className="text-3xl mb-2">{done === "public" ? "🌎" : done === "private" ? "🔒" : "✓"}</div>
        <h3 className="font-display text-xl font-semibold mb-1">
          {done === "public"
            ? "Your perspective is live"
            : done === "private"
              ? "Saved to your calendar"
              : "Skipped for today"}
        </h3>
        <p className="text-muted text-sm mb-5">
          {done === "public"
            ? "It's now part of today's community answers."
            : done === "private"
              ? "Only you can see this answer."
              : "No pressure. Come back tomorrow."}
        </p>
        <Button as="a" href="/" variant="secondary" size="sm">
          Back to today
        </Button>
      </div>
    );
  }

  const points = previewPoints(visibility, content.trim().length);

  return (
    <div className="rounded-[var(--radius)] border bg-surface p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-subtle mb-3">
        Your answer
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your answer…"
        rows={4}
        maxLength={1000}
        disabled={submitting}
        className="w-full resize-none rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60 focus:bg-surface transition placeholder:text-subtle"
      />
      <div className="flex justify-between items-center mt-1.5 text-xs text-subtle">
        <span>{content.length}/1000</span>
      </div>

      {/* Visibility toggle — made deliberately loud */}
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-[var(--radius-sm)] bg-surface-2">
          <VisibilityOption
            active={!isPublic}
            onClick={() => setVisibility("private")}
            icon="🔒"
            label="Private"
            desc="Only you can see it"
          />
          <VisibilityOption
            active={isPublic}
            onClick={() => setVisibility("public")}
            icon="🌎"
            label="Public"
            desc="Anyone can read it"
          />
        </div>

        {isPublic && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-sm)] border border-accent/40 bg-accent-soft px-3 py-2.5 text-sm text-foreground animate-fade-up"
          >
            <span aria-hidden>⚠️</span>
            <span>
              <strong>This will be visible to everyone.</strong> Anyone on Questista can read
              this answer and react to it. Double-check before posting.
            </span>
          </p>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <Button onClick={() => submit(visibility)} disabled={submitting || (visibility !== "skipped" && content.trim().length === 0)} className="flex-1">
          {submitting ? <Spinner /> : isPublic ? "Post public answer" : "Save private answer"}
        </Button>
        <Button variant="ghost" onClick={() => submit("skipped")} disabled={submitting}>
          Skip today
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-subtle">
        {visibility === "skipped" ? "Skipping is fine — no streaks to lose." : `+${points} Confidence Points for showing up today`}
      </p>
    </div>
  );
}

function VisibilityOption({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-all",
        active ? "bg-surface shadow-sm ring-2 ring-primary/50" : "hover:bg-surface/60",
      )}
    >
      <span className="text-xl" aria-hidden>{icon}</span>
      <span className="leading-tight">
        <span className={cn("block text-sm font-medium", active ? "text-foreground" : "text-muted")}>
          {label}
        </span>
        <span className="block text-xs text-subtle">{desc}</span>
      </span>
    </button>
  );
}

function previewPoints(visibility: Visibility, len: number) {
  if (visibility === "skipped") return 2;
  let p = 3 + 2; // base + daily return
  if (visibility === "public") p += 2;
  if (len >= 80) p += 1;
  return p;
}