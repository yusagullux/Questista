import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth callback for Google + GitHub. Exchanges the code for a session.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // On failure, send back to login with an error flag.
  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}