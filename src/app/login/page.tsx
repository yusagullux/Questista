"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Spinner, Card } from "../components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "github">(null);
  const [error, setError] = useState<string | null>(null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirect)}`;

  async function emailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function oauth(provider: "google" | "github") {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  }

  return (
    <Card className="p-6 sm:p-8 animate-fade-up">
      <h1 className="font-display text-2xl font-semibold mb-1">Welcome back</h1>
      <p className="text-muted text-sm mb-6">Log in to answer today's question.</p>

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

      <form onSubmit={emailLogin} className="grid gap-3">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={!!loading}>
          {loading === "email" ? <Spinner /> : null} Log in
        </Button>
      </form>

      <p className="text-sm text-muted text-center mt-5">
        New here? <a href="/signup" className="text-primary hover:underline">Create an account</a>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Suspense
        fallback={
          <div className="py-16 text-center">
            <Spinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}