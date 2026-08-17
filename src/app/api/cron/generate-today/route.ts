import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ensureTodayQuestion } from "@/lib/ai";
import { authorizeCron } from "@/lib/cron-auth";

/**
 * Cron job: guarantees the current Estonian day has a published question.
 * Runs hourly and is idempotent — if today already has a question it no-ops;
 * otherwise it schedules a draft, or generates one fresh. Hourly runs also
 * self-heal: if an earlier run failed (transient Gemini outage), the next
 * hour retries. Estonia's midnight falls at 21:00–22:00 UTC (DST), so hourly
 * coverage means today's question appears within ~1h of local midnight.
 */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const service = createServiceClient();
  const result = await ensureTodayQuestion(service);
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}