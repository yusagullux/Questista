"use client";

import { useId, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Spinner, Field, Input, Textarea, Skeleton } from "../components/ui";
import { toast } from "../components/toaster";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const nameId = useId();
  const usernameId = useId();
  const bioId = useId();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (!cancelled) router.push("/login?redirect=/settings");
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (cancelled) return;
      if (p) {
        setDisplayName(p.display_name ?? "");
        setBio(p.bio ?? "");
        setUsername(p.username ?? "");
      }
      setInitialLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setSaving(false);
      return router.push("/login?redirect=/settings");
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || username,
        bio: bio.trim().slice(0, 280),
      })
      .eq("id", data.user.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
    } else {
      toast("Settings saved.", "success");
      router.refresh();
    }
  }

  async function resetPassword() {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return;
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
    });
    setResetting(false);
    if (error) toast("Could not send reset email. Try again.", "danger");
    else toast("Password reset email sent.", "success");
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete your account and all answers? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      await supabase.auth.signOut();
      toast("Account deleted.", "success");
      router.push("/");
    } else {
      toast("Could not delete account. Try again.", "danger");
    }
  }

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card className="p-6 mb-4">
          <div className="grid gap-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-2xl font-semibold mb-6">Settings</h1>

      <Card className="p-6 mb-4">
        <h2 className="font-medium mb-4">Profile</h2>
        <form onSubmit={save} className="grid gap-4">
          <Field label="Username" id={usernameId} hint="Usernames can't be changed.">
            <Input id={usernameId} value={username} disabled />
          </Field>
          <Field label="Display name" id={nameId}>
            <Input
              id={nameId}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="How you'll appear publicly"
              disabled={saving}
            />
          </Field>
          <Field label="Bio" id={bioId} hint={`${bio.length}/280`}>
            <Textarea
              id={bioId}
              value={bio}
              maxLength={280}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line or two about you (optional)"
              disabled={saving}
            />
          </Field>
          {err && (
            <p className="text-sm text-danger" role="alert">
              {err}
            </p>
          )}
          <div>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="font-medium mb-2">Security</h2>
        <p className="text-sm text-muted mb-3">Send yourself a password reset link.</p>
        <Button variant="secondary" onClick={resetPassword} loading={resetting}>
          Reset password
        </Button>
      </Card>

      <Card className="p-6 border-danger/30">
        <h2 className="font-medium mb-2 text-danger">Danger zone</h2>
        <p className="text-sm text-muted mb-3">
          Deleting your account removes your profile, answers, and history permanently.
        </p>
        <Button variant="danger" onClick={deleteAccount} loading={deleting}>
          Delete account
        </Button>
      </Card>
    </div>
  );
}