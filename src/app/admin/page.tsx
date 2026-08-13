"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Spinner, Badge } from "../components/ui";
import { ModerationPanel } from "../components/moderation-panel";

export default function AdminPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();
      const admin = !!p?.is_admin;
      if (cancelled) return;
      setIsAdmin(admin);
      if (!admin) return;
      // Load stats only after confirming admin — setState happens after awaits.
      const [users, questions, answers, reports] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("answers").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      setStats({
        users: users.count ?? 0,
        questions: questions.count ?? 0,
        answers: answers.count ?? 0,
        reports: reports.count ?? 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function loadStats() {
    const [users, questions, answers, reports] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("questions").select("*", { count: "exact", head: true }),
      supabase.from("answers").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      users: users.count ?? 0,
      questions: questions.count ?? 0,
      answers: answers.count ?? 0,
      reports: reports.count ?? 0,
    });
  }

  async function generate(mode: "today" | "batch") {
    setBusy(mode);
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/questions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "batch" ? { mode: "batch", count: 5 } : { mode: "today" }),
    });
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error ?? "Failed");
    setMsg(
      mode === "today"
        ? data.ok
          ? `Published: "${data.question?.prompt ?? "?"}"`
          : data.reason ?? "Today already has a question."
        : `Generated ${data.inserted} questions (${data.skippedDuplicates} duplicates skipped).`,
    );
    loadStats();
  }

  if (isAdmin === null) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Spinner /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">You don't have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
        <Badge tone="primary">Moderator</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k} className="p-4 text-center">
            <div className="font-display text-2xl font-semibold">{v}</div>
            <div className="text-xs text-subtle capitalize">{k}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mb-4">
        <h2 className="font-medium mb-1">Question generation</h2>
        <p className="text-sm text-muted mb-3">
          Generate today's question with AI (deduplicated against the last 120), or build a batch of 5 drafts to schedule later.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => generate("today")} disabled={!!busy}>
            {busy === "today" ? <Spinner /> : null} Generate today's
          </Button>
          <Button variant="secondary" onClick={() => generate("batch")} disabled={!!busy}>
            {busy === "batch" ? <Spinner /> : null} Generate 5 drafts
          </Button>
        </div>
        {msg && <p className="text-sm text-success mt-3">{msg}</p>}
        {err && <p className="text-sm text-danger mt-3">{err}</p>}
      </Card>

      <ModerationPanel />
    </div>
  );
}