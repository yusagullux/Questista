import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/signup
 * Body: { email, password, username }
 *
 * Server-side signup that creates an already-confirmed user via the
 * service-role admin API. This bypasses Supabase's "Confirm email" gate and
 * the free-tier email-send rate limit (admin.createUser sends no email),
 * so public signups work without dashboard config or an external SMTP
 * provider. The handle_new_user trigger still fires and creates the profile.
 *
 * The response only reports success/failure — the client then signs in with
 * signInWithPassword (the account is confirmed, so login is immediate) to
 * establish its own session. The service_role key never leaves the server.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (username.length < 3 || !/^[a-z0-9_]+$/i.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3+ chars, letters/numbers/underscore only." },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: username },
  });

  if (error) {
    // Supabase returns `user_already_exists` / `over_email_send_rate_limit`
    // etc. Surface a clean message; the admin path itself is not rate-limited.
    const friendly =
      error.code === "user_already_exists"
        ? "An account with that email already exists. Try logging in."
        : error.message;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.user?.id ?? null });
}