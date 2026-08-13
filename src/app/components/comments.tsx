"use client";

import { useEffect, useState } from "react";
import { Avatar, Spinner } from "./ui";
import { cn, timeAgo } from "@/lib/utils";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function Comments({ answerId, currentUsername }: { answerId: string; currentUsername: string | null }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/comments?answer_id=${answerId}`);
    const data = await res.json().catch(() => ({}));
    setComments(data.comments ?? []);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/comments?answer_id=${answerId}`);
      const data = await res.json().catch(() => ({}));
      if (!cancelled) setComments(data.comments ?? []);
    })();
    return () => {
      cancelled = true;
    };
    // `load` is reused by submit() after a post; the effect loads on open.
  }, [open, answerId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUsername) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_id: answerId, content: draft.trim(), parent_id: replyTo }),
    });
    setBusy(false);
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(e.error ?? "Couldn't post comment");
      return;
    }
    setDraft("");
    setReplyTo(null);
    await load();
  }

  async function remove(id: string) {
    const prev = comments;
    setComments((c) => (c ?? []).filter((x) => x.id !== id && x.parent_id !== id));
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (!res.ok) setComments(prev);
  }

  const roots = (comments ?? []).filter((c) => !c.parent_id);
  const repliesFor = (id: string) => (comments ?? []).filter((c) => c.parent_id === id);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        {open ? "Hide comments" : "Add a comment"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t pt-3 animate-fade-up">
          {comments === null ? (
            <div className="py-2"><Spinner /></div>
          ) : roots.length === 0 ? (
            <p className="text-sm text-subtle">No comments yet. Start the conversation.</p>
          ) : (
            roots.map((c) => (
              <div key={c.id}>
                <CommentRow c={c} currentUsername={currentUsername} onDelete={() => remove(c.id)} />
                <div className="ml-10 mt-2 space-y-2">
                  {repliesFor(c.id).map((r) => (
                    <CommentRow key={r.id} c={r} currentUsername={currentUsername} onDelete={() => remove(r.id)} reply />
                  ))}
                  {currentUsername && (
                    <button
                      onClick={() => setReplyTo(c.id)}
                      className="text-xs text-subtle hover:text-foreground"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {currentUsername ? (
            <form onSubmit={submit} className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={replyTo ? "Your reply…" : "Add a comment…"}
                maxLength={500}
                className="flex-1 rounded-[var(--radius-sm)] border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="rounded-[var(--radius-sm)] bg-primary text-white text-sm px-4 py-2 disabled:opacity-50"
              >
                {busy ? <Spinner /> : "Post"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-subtle">Log in to comment.</p>
          )}
          {replyTo && (
            <button onClick={() => setReplyTo(null)} className="text-xs text-subtle hover:text-foreground">
              Cancel reply
            </button>
          )}
          {err && <p className="text-sm text-danger">{err}</p>}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  c,
  currentUsername,
  onDelete,
  reply,
}: {
  c: Comment;
  currentUsername: string | null;
  onDelete: () => void;
  reply?: boolean;
}) {
  const author = c.author;
  return (
    <div className={cn("flex gap-2", reply && "mb-1")}>
      <Avatar name={author?.display_name ?? author?.username} src={author?.avatar_url} size={28} />
      <div className="min-w-0 flex-1">
        <div className="text-xs">
          <span className="font-medium">@{author?.username ?? "unknown"}</span>{" "}
          <span className="text-subtle">{timeAgo(c.created_at)}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
      </div>
      {author?.username === currentUsername && (
        <button onClick={onDelete} className="text-xs text-subtle hover:text-danger self-start">
          Delete
        </button>
      )}
    </div>
  );
}