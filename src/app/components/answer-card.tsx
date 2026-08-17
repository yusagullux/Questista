"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./ui";
import { HeartIcon } from "./icons";
import { cn, timeAgo } from "@/lib/utils";
import type { FeedAnswer } from "@/lib/types";
import { Comments } from "./comments";
import { ShareButton } from "./share-button";
import { ReportButton } from "./report-button";

export function AnswerCard({
  answer,
  viewerUsername,
}: {
  answer: FeedAnswer;
  viewerUsername: string | null;
}) {
  const [reacted, setReacted] = useState(answer.viewer_reacted);
  const [count, setCount] = useState(answer.reaction_count);
  const [busy, setBusy] = useState(false);

  async function toggleReact() {
    setBusy(true);
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_id: answer.id, type: "like" }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (data.reacted) {
      setReacted(true);
      setCount((c) => c + 1);
    } else {
      setReacted(false);
      setCount((c) => Math.max(0, c - 1));
    }
  }

  const author = answer.profiles;
  const isOwn = author?.username === viewerUsername;

  return (
    <article
      id={`answer-${answer.id}`}
      className="rounded-[var(--radius)] border border-border bg-surface p-5 animate-fade-up"
    >
      {/* ── Hairline header: author + dateline + level stamp ── */}
      <header className="flex items-center gap-3 pb-3 border-b border-border">
        <Link href={author ? `/u/${author.username}` : "#"} className="shrink-0">
          <Avatar name={author?.display_name ?? author?.username} src={author?.avatar_url} size={36} />
        </Link>
        <div className="min-w-0">
          <Link
            href={author ? `/u/${author.username}` : "#"}
            className="font-medium text-sm hover:underline truncate block"
          >
            @{author?.username ?? "unknown"}
          </Link>
          <div className="masthead text-[0.625rem] mt-0.5">{timeAgo(answer.created_at)}</div>
        </div>
        {author?.confidence_level && (
          <span className="stamp stamp--ochre ml-auto">
            <span aria-hidden>◆</span> {author.confidence_level}
          </span>
        )}
      </header>

      {/* ── The entry — printed in Fraunces, read like a page ── */}
      <p className="prose-entry whitespace-pre-wrap text-foreground py-3.5">
        {answer.content}
      </p>

      {/* ── Hairline footer: reaction + share + report ── */}
      <footer className="mt-1 pt-3 border-t border-border flex items-center gap-4">
        <button
          onClick={toggleReact}
          disabled={busy}
          aria-pressed={reacted}
          aria-label={reacted ? "Remove reaction" : "React to this answer"}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-[var(--radius-sm)]",
            reacted ? "text-primary" : "text-muted hover:text-foreground",
          )}
        >
          <HeartIcon filled={reacted} className={cn("h-[18px] w-[18px]", reacted && "animate-pop")} />
          {count > 0 && <span className="tabular-nums">{count}</span>}
        </button>

        <ShareButton answerId={answer.id} />
        {!isOwn && <ReportButton targetType="answer" targetId={answer.id} />}
      </footer>

      <Comments answerId={answer.id} currentUsername={viewerUsername} />
    </article>
  );
}