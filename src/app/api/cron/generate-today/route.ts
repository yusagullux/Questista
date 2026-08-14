import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ensureTodayQuestion } from "@/lib/ai";

/**
 * Cron job: generates + publishes today's question if none exists.
 * Protected by CRON_SECRET (Vercel sends it as `Authorization: Bearer <secret>`).
 */
export async function GET(request: NextRequest) {
  // Trim both sides — a trailing newline on a pasted secret is a common
  // silent failure (the cron 401s forever with no error log).
  const auth = request.headers.get("authorization")?.trim();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const result = await ensureTodayQuestion(service);
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}