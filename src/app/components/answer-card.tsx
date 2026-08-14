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
    <article id={`answer-${answer.id}`} className="rounded-[var(--radius)] border bg-surface p-5 shadow-sm animate-fade-up">
      <header className="flex items-center gap-3 mb-3">
        <Link href={author ? `/u/${author.username}` : "#"}>
          <Avatar name={author?.display_name ?? author?.username} src={author?.avatar_url} size={40} />
        </Link>
        <div className="min-w-0">
          <Link
            href={author ? `/u/${author.username}` : "#"}
            className="font-medium text-sm hover:underline truncate block"
          >
            @{author?.username ?? "unknown"}
          </Link>
          <div className="text-xs text-subtle">{timeAgo(answer.created_at)}</div>
        </div>
        {author?.confidence_level && (
          <span className="ml-auto text-xs text-accent">◆ {author.confidence_level}</span>
        )}
      </header>

      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
        {answer.content}
      </p>

      <footer className="mt-4 flex items-center gap-4">
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
          {count > 0 && <span>{count}</span>}
        </button>

        <ShareButton answerId={answer.id} />
        {!isOwn && <ReportButton targetType="answer" targetId={answer.id} />}
      </footer>

      <Comments answerId={answer.id} currentUsername={viewerUsername} />
    </article>
  );
}