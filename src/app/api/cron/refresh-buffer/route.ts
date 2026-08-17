import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { refreshDraftBuffer } from "@/lib/ai";
import { authorizeCron } from "@/lib/cron-auth";

/**
 * Cron job: keeps a buffer of draft questions stocked so a transient Gemini
 * outage never leaves a day without a question. Runs once daily off-peak.
 */
export async function GET(request: Request) {
  const denied = authorizeCron(request as any);
  if (denied) return denied;

  const service = createServiceClient();
  try {
    const result = await refreshDraftBuffer(service);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Buffer refresh failed." }, { status: 500 });
  }
}