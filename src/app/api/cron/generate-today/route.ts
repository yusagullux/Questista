import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ensureTodayQuestion } from "@/lib/ai";

/**
 * Cron job: generates + publishes today's question if none exists.
 * Protected by CRON_SECRET (Vercel sends it as `Authorization: Bearer <secret>`).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const result = await ensureTodayQuestion(service);
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}