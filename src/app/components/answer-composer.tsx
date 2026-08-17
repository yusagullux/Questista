"use client";

import { useState } from "react";
import { Button, Spinner } from "./ui";
import { LockIcon, GlobeIcon, CheckIcon } from "./icons";
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
    const map = {
      public: { title: "Your perspective is live", text: "It's now part of today's community answers.", stamp: "Posted" },
      private: { title: "Saved to your calendar", text: "Only you can see this answer.", stamp: "Private" },
      skipped: { title: "Skipped for today", text: "No pressure. Come back tomorrow.", stamp: "Skipped" },
    } as const;
    const s = map[done];
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center animate-pop">
        <div className="flex justify-center mb-3">
          <span className="stamp stamp--filled text-base px-3 py-1">{s.stamp}</span>
        </div>
        <h3 className="font-display text-xl font-semibold mb-1">{s.title}</h3>
        <p className="text-muted text-sm mb-5">{s.text}</p>
        <Button as="a" href="/" variant="secondary" size="sm">
          Back to today
        </Button>
      </div>
    );
  }

  const points = previewPoints(visibility, content.trim().length);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-5 sm:p-6">
      <p className="masthead mb-3">Your entry</p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your answer…"
        rows={4}
        maxLength={1000}
        disabled={submitting}
        className="w-full resize-none rounded-[var(--radius-sm)] border border-border bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60 focus:bg-surface transition placeholder:text-subtle font-display"
      />
      <div className="flex justify-between items-center mt-1.5 text-xs text-subtle">
        <span className="masthead">{content.length}/1000</span>
      </div>

      {/* Visibility — two stamp-style toggles */}
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          <VisibilityOption
            active={!isPublic}
            onClick={() => setVisibility("private")}
            icon={<LockIcon className="h-4 w-4" />}
            label="Private"
            desc="Only you can see it"
          />
          <VisibilityOption
            active={isPublic}
            onClick={() => setVisibility("public")}
            icon={<GlobeIcon className="h-4 w-4" />}
            label="Public"
            desc="Anyone can read it"
          />
        </div>

        {isPublic && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-sm)] border border-primary/40 bg-primary-soft px-3 py-2.5 text-sm text-foreground animate-fade-up"
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
        {visibility === "skipped" ? "Skipping is fine — no streaks to lose." : `+${points} confidence points for showing up today`}
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
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-all",
        active
          ? "border-primary bg-primary-soft text-foreground"
          : "border-border bg-surface-2 text-muted hover:bg-surface-2/60",
      )}
    >
      <span className={cn("shrink-0", active ? "text-primary" : "text-subtle")} aria-hidden>
        {icon}
      </span>
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