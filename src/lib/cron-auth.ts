import { NextRequest, NextResponse } from "next/server";

/**
 * Validate the Vercel cron Bearer token. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`. Both sides are trimmed because a
 * trailing newline on a pasted secret is a common silent 401.
 * Returns null on success, or a 401 NextResponse on failure.
 */
export function authorizeCron(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("authorization")?.trim();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}