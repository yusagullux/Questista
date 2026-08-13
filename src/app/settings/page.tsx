"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Spinner } from "../components/ui";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (p) {
        setDisplayName(p.display_name ?? "");
        setBio(p.bio ?? "");
        setUsername(p.username ?? "");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || username,
        bio: bio.trim().slice(0, 280),
      })
      .eq(
        "id",
        (await supabase.auth.getUser()).data.user!.id,
      );
    setSaving(false);
    if (error) setErr(error.message);
    else {
      setMsg("Saved.");
      router.refresh();
    }
  }

  async function resetPassword() {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return;
    await supabase.auth.resetPasswordForEmail(data.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
    });
    setMsg("Password reset email sent.");
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete your account and all answers? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/login");
    } else {
      setErr("Could not delete account. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-2xl font-semibold mb-6">Settings</h1>

      <Card className="p-6 mb-4">
        <h2 className="font-medium mb-4">Profile</h2>
        <form onSubmit={save} className="grid gap-3">
          <label className="text-sm text-muted">Username
            <input
              value={username}
              disabled
              className="mt-1 w-full rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm opacity-60"
            />
          </label>
          <label className="text-sm text-muted">Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          </label>
          <label className="text-sm text-muted">Bio
            <textarea
              value={bio}
              maxLength={280}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full resize-none rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          </label>
          {err && <p className="text-sm text-danger">{err}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null} Save changes
          </Button>
        </form>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="font-medium mb-2">Security</h2>
        <p className="text-sm text-muted mb-3">Send yourself a password reset link.</p>
        <Button variant="secondary" onClick={resetPassword}>Reset password</Button>
      </Card>

      <Card className="p-6 border-danger/30">
        <h2 className="font-medium mb-2 text-danger">Danger zone</h2>
        <p className="text-sm text-muted mb-3">
          Deleting your account removes your profile, answers, and history permanently.
        </p>
        <Button variant="danger" onClick={deleteAccount} disabled={deleting}>
          {deleting ? <Spinner /> : null} Delete account
        </Button>
      </Card>
    </div>
  );
}