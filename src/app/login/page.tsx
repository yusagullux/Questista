"use client";

import { Suspense, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Spinner, Card, Field, Input } from "../components/ui";
import { GoogleIcon, GitHubIcon } from "../components/icons";
import { Divider } from "../components/divider";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const emailId = useId();
  const pwdId = useId();

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
    <Card className="p-6 sm:p-8 animate-fade-up">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
        <span className="masthead">Questista</span>
        <span className="masthead">Log in</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-1">Welcome back</h1>
      <p className="text-muted text-sm mb-6">Log in to answer today's question.</p>

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

      <form onSubmit={emailLogin} className="grid gap-3" noValidate>
        <Field label="Email" id={emailId} error={error}>
          <Input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!error}
            disabled={!!loading}
          />
        </Field>
        <Field label="Password" id={pwdId}>
          <Input
            id={pwdId}
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!!loading}
          />
        </Field>
        <Button type="submit" loading={loading === "email"} disabled={!!loading} className="mt-1">
          Log in
        </Button>
      </form>

      <p className="text-sm text-muted text-center mt-5">
        New here?{" "}
        <a href="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </a>
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