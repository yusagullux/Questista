"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field, Input, Spinner } from "../components/ui";
import { GoogleIcon, GitHubIcon } from "../components/icons";
import { Divider } from "../components/divider";

export default function SignupPage() {
  const router = useRouter();
  const emailId = useId();
  const pwdId = useId();
  const userId = useId();
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
    setConfirm(null);
    if (username.trim().length < 3 || !/^[a-z0-9_]+$/i.test(username)) {
      setError("Username must be 3+ chars, letters/numbers/underscore only.");
      return;
    }
    setLoading("email");
    try {
      // Create the account server-side (service-role) so it's confirmed
      // immediately — no email round-trip, no rate-limit gate. Then sign in
      // on the client to establish this user's own session.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: username.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(null);
        setError(json?.error ?? "Sign up failed. Please try again.");
        return;
      }
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(null);
      if (signInError) {
        // Account was created; tell them to log in manually.
        setConfirm("Account created! Please log in.");
        router.push("/login");
        router.refresh();
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setLoading(null);
      setError("Network error. Please try again.");
    }
  }

  async function oauth(provider: "google" | "github") {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    // On success the browser is redirected away, so this line is a safety net
    // for the failure case (provider disabled, misconfigured, network, etc.).
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    setLoading(null);
    if (error) {
      setError(
        `Couldn't start ${provider === "google" ? "Google" : "GitHub"} sign-in. ${error.message}`,
      );
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Card className="p-6 sm:p-8 animate-fade-up">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
          <span className="masthead">Questista</span>
          <span className="masthead">Join</span>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-1">Join Questista</h1>
        <p className="text-muted text-sm mb-6">One question a day. Answer on your terms.</p>

        <div className="grid gap-2 mb-5">
          <Button
            variant="secondary"
            onClick={() => oauth("google")}
            disabled={!!loading}
            aria-label="Continue with Google"
          >
            {loading === "google" ? <Spinner /> : <GoogleIcon className="h-5 w-5" />}
            Continue with Google
          </Button>
          <Button
            variant="secondary"
            onClick={() => oauth("github")}
            disabled={!!loading}
            aria-label="Continue with GitHub"
          >
            {loading === "github" ? <Spinner /> : <GitHubIcon className="h-5 w-5" />}
            Continue with GitHub
          </Button>
        </div>

        <Divider label="or with email" />

        <form onSubmit={emailSignup} className="grid gap-3" noValidate>
          <Field label="Username" id={userId} hint="3+ characters, letters, numbers, or underscore.">
            <Input
              id={userId}
              required
              minLength={3}
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={!!loading}
            />
          </Field>
          <Field label="Email" id={emailId}>
            <Input
              id={emailId}
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={!!loading}
            />
          </Field>
          <Field label="Password" id={pwdId} hint="At least 8 characters.">
            <Input
              id={pwdId}
              type="password"
              required
              minLength={8}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={!!loading}
            />
          </Field>
          {error && (
            <p className="text-sm text-danger rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2" role="alert">
              {error}
            </p>
          )}
          {confirm && (
            <p className="text-sm text-success rounded-[var(--radius-sm)] bg-success-soft px-3 py-2" role="status">
              {confirm}
            </p>
          )}
          <Button type="submit" loading={loading === "email"} disabled={!!loading} className="mt-1">
            Create account
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-primary font-medium hover:underline">
            Log in
          </a>
        </p>
      </Card>
    </div>
  );
}