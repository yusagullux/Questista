import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  question_id: z.string().uuid(),
  content: z.string().max(1000).default(""),
  visibility: z.enum(["public", "private", "skipped"]),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { question_id, content, visibility } = parsed.data;

  if (visibility !== "skipped" && content.trim().length === 0) {
    return NextResponse.json(
      { error: "Write something, or choose Skip." },
      { status: 400 },
    );
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("id", question_id)
    .single();
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Has the user already answered this question today? (unique user+question)
  const { data: existing } = await supabase
    .from("answers")
    .select("id, visibility")
    .eq("user_id", user.id)
    .eq("question_id", question_id)
    .maybeSingle();

  const trimmed = visibility === "skipped" ? null : content.trim();

  let result;
  if (existing) {
    // Update only — points already awarded on first insert. Keep counters honest
    // if the user flips public<->private or answered<->skipped.
    const wasPublic = existing.visibility === "public";
    const isPublic = visibility === "public";
    const wasSkipped = existing.visibility === "skipped";
    const isSkipped = visibility === "skipped";

    if (wasSkipped !== isSkipped) {
      await supabase.rpc("adjust_profile_count", {
        p_user: user.id,
        p_column: "answers_count",
        p_delta: isSkipped ? -1 : 1,
      });
    }
    if (wasPublic !== isPublic) {
      await supabase.rpc("adjust_profile_count", {
        p_user: user.id,
        p_column: "public_answers_count",
        p_delta: isPublic ? 1 : -1,
      });
    }

    result = await supabase
      .from("answers")
      .update({ content: trimmed, visibility, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id, visibility")
      .single();
  } else {
    result = await supabase
      .from("answers")
      .insert({
        user_id: user.id,
        question_id,
        content: trimmed,
        visibility,
      })
      .select("id, visibility")
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, answer: result.data });
}