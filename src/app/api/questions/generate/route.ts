import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ensureTodayQuestion, refreshDraftBuffer } from "@/lib/ai";

/**
 * POST /api/questions/generate
 * Body: { mode: "today" | "batch", count?: number }
 * Admin only. "today" generates + publishes today's question if none exists.
 * "batch" generates `count` (default 5) draft questions for later scheduling.
 *
 * Also intended to be invoked by a cron — see vercel.ts crons.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === "batch" || body?.mode === "buffer" ? "buffer" : "today";

  const service = createServiceClient();

  if (mode === "today") {
    const result = await ensureTodayQuestion(service);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: result.created, ...result });
  }

  // buffer mode — top up the draft reserve so AI downtime never leaves a day empty.
  try {
    const result = await refreshDraftBuffer(service);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Generation failed. Check GEMINI_API_KEY / model availability." },
      { status: 500 },
    );
  }
}