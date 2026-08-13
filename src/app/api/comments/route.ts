import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// GET /api/comments?answer_id=...  — list comments for a public answer
export async function GET(request: NextRequest) {
  const answer_id = request.nextUrl.searchParams.get("answer_id");
  if (!answer_id) {
    return NextResponse.json({ error: "answer_id required" }, { status: 400 });
  }
  const supabase = await createClient();

  // Only allow comments on public answers (RLS would let readers see private
  // answers' comments rows, so guard the target here too).
  const { data: answer } = await supabase
    .from("answers")
    .select("visibility")
    .eq("id", answer_id)
    .maybeSingle();
  if (!answer || answer.visibility !== "public") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select(
      "*, author:profiles!user_id(username,display_name,avatar_url)",
    )
    .eq("answer_id", answer_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data ?? [] });
}

const Body = z.object({
  answer_id: z.string().uuid(),
  content: z.string().min(1).max(500),
  parent_id: z.string().uuid().nullable().optional(),
});

// POST — create a comment (or reply)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { answer_id, content, parent_id } = parsed.data;

  // Guard: can only comment on public answers.
  const { data: answer } = await supabase
    .from("answers")
    .select("visibility")
    .eq("id", answer_id)
    .maybeSingle();
  if (!answer || answer.visibility !== "public") {
    return NextResponse.json({ error: "Can't comment there" }, { status: 400 });
  }

  // If replying, ensure parent belongs to the same answer.
  if (parent_id) {
    const { data: parent } = await supabase
      .from("comments")
      .select("answer_id")
      .eq("id", parent_id)
      .maybeSingle();
    if (!parent || parent.answer_id !== answer_id) {
      return NextResponse.json({ error: "Invalid reply target" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      answer_id,
      user_id: user.id,
      content: content.trim(),
      parent_id: parent_id ?? null,
    })
    .select("id, content, created_at, parent_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, comment: data });
}