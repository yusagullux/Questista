"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Spinner, Card } from "../components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "github">(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectTo = `${siteUrl}/auth/callback`;

  async function emailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (username.trim().length < 3 || !/^[a-z0-9_]+$/i.test(username)) {
      setError("Username must be 3+ chars, letters/numbers/underscore only.");
      return;
    }
    setLoading("email");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim(), full_name: username.trim() } },
    });
    setLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setConfirm("Check your email for a confirmation link to finish signing up.");
    }
  }

  async function oauth(provider: "google" | "github") {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Card className="p-6 sm:p-8 animate-fade-up">
        <h1 className="font-display text-2xl font-semibold mb-1">Join Questista</h1>
        <p className="text-muted text-sm mb-6">One question a day. Answer on your terms.</p>

        <div className="grid gap-2 mb-5">
          <Button variant="secondary" onClick={() => oauth("google")} disabled={!!loading}>
            {loading === "google" ? <Spinner /> : "G"} Continue with Google
          </Button>
          <Button variant="secondary" onClick={() => oauth("github")} disabled={!!loading}>
            {loading === "github" ? <Spinner /> : "GH"} Continue with GitHub
          </Button>
        </div>

        <div className="relative my-4 text-center">
          <span className="bg-surface px-3 text-xs text-subtle relative z-10">or with email</span>
          <div className="absolute inset-y-1/2 left-0 right-0 border-t" />
        </div>

        <form onSubmit={emailSignup} className="grid gap-3">
          <input
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60 lowercase"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {confirm && (
            <p className="text-sm text-success rounded-[var(--radius-sm)] bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2">
              {confirm}
            </p>
          )}
          <Button type="submit" disabled={!!loading}>
            {loading === "email" ? <Spinner /> : null} Create account
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-5">
          Already have an account? <a href="/login" className="text-primary hover:underline">Log in</a>
        </p>
      </Card>
    </div>
  );
}