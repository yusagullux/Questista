"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, Spinner } from "./ui";
import { timeAgo } from "@/lib/utils";

type Report = {
  id: string;
  target_type: "answer" | "comment";
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  target?: {
    content: string | null;
    user_id: string;
    profiles?: { username: string } | null;
  } | null;
};

export function ModerationPanel() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/reports");
    const data = await res.json().catch(() => ({}));
    setReports(data.reports ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/reports");
      const data = await res.json().catch(() => ({}));
      if (!cancelled) setReports(data.reports ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function remove(report: Report) {
    setBusyId(report.id);
    const endpoint =
      report.target_type === "answer"
        ? `/api/admin/answers/${report.target_id}`
        : `/api/admin/comments/${report.target_id}`;
    await fetch(endpoint, { method: "DELETE" });
    await resolve(report, "resolved");
    setBusyId(null);
    load();
  }

  async function resolve(report: Report, status: "resolved" | "dismissed") {
    setBusyId(report.id);
    await fetch(`/api/admin/reports/${report.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    load();
  }

  return (
    <Card className="p-5">
      <h2 className="font-medium mb-1">Moderation queue</h2>
      <p className="text-sm text-muted mb-4">Reported content awaiting review.</p>

      {reports === null ? (
        <div className="py-6 text-center"><Spinner /></div>
      ) : reports.length === 0 ? (
        <EmptyState title="Queue is clear" icon="✅">No open reports right now.</EmptyState>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-sm)] border p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-2 text-xs text-subtle">
                <span>
                  {r.target_type} by @{r.target?.profiles?.username ?? "unknown"} · {timeAgo(r.created_at)}
                </span>
                <span className="text-danger">{r.reason}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap mb-3">
                {r.target?.content ?? <span className="text-subtle italic">Content already removed</span>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => remove(r)}
                  disabled={busyId === r.id}
                  className="rounded-[6px] bg-danger text-white text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  Remove content
                </button>
                <button
                  onClick={() => resolve(r, "dismissed")}
                  disabled={busyId === r.id}
                  className="rounded-[6px] border text-sm px-3 py-1.5 hover:bg-surface-2 disabled:opacity-50"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => resolve(r, "resolved")}
                  disabled={busyId === r.id}
                  className="rounded-[6px] border text-sm px-3 py-1.5 hover:bg-surface-2 disabled:opacity-50"
                >
                  Mark resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}