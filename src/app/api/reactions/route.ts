import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  answer_id: z.string().uuid(),
  type: z.string().max(20).default("like"),
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
  const { answer_id, type } = parsed.data;

  // Verify the target is a public answer (can't react to private/skipped).
  const { data: answer } = await supabase
    .from("answers")
    .select("visibility, user_id")
    .eq("id", answer_id)
    .maybeSingle();
  if (!answer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (answer.visibility !== "public") {
    return NextResponse.json({ error: "Can't react to that" }, { status: 400 });
  }

  // Toggle: if a reaction exists, remove it; otherwise insert.
  const { data: existing } = await supabase
    .from("reactions")
    .select("answer_id")
    .eq("answer_id", answer_id)
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("answer_id", answer_id)
      .eq("user_id", user.id)
      .eq("type", type);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ reacted: false });
  }

  const { error } = await supabase
    .from("reactions")
    .insert({ answer_id, user_id: user.id, type });
  if (error) {
    // race: another insert landed first → treat as reacted
    if (error.code === "23505") return NextResponse.json({ reacted: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ reacted: true });
}