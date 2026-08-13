"use client";

import { useState } from "react";
import { Spinner } from "./ui";

const REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Sexual or NSFW",
  "Misinformation",
  "Something else",
];

export function ReportButton({ targetType, targetId }: { targetType: "answer" | "comment"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
    });
    setBusy(false);
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(e.error ?? "Couldn't report");
      return;
    }
    setDone(true);
  }

  if (done) return <span className="text-xs text-success">Reported. Thank you.</span>;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-subtle hover:text-foreground transition-colors"
        aria-label="Report"
        title="Report"
      >
        {open ? "Cancel" : "Report"}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-[var(--radius-sm)] border bg-surface-2 text-sm space-y-2 animate-fade-up">
          <label className="block text-xs text-muted">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-[6px] border bg-surface px-2 py-1.5 text-sm"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {err && <p className="text-xs text-danger">{err}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-[6px] bg-danger text-white text-sm px-3 py-1.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Spinner /> : null} Submit report
          </button>
        </div>
      )}
    </div>
  );
}