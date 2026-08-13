import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  target_type: z.enum(["answer", "comment"]),
  target_id: z.string().uuid(),
  reason: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { target_type, target_id, reason } = parsed.data;

  // Guard: the reported target must exist and be public (answers) or belong to a public answer (comments).
  if (target_type === "answer") {
    const { data: a } = await supabase
      .from("answers")
      .select("visibility")
      .eq("id", target_id)
      .maybeSingle();
    if (!a || a.visibility !== "public") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    const { data: c } = await supabase
      .from("comments")
      .select("answer_id, answers:answers!answer_id(visibility)")
      .eq("id", target_id)
      .maybeSingle();
    const vis = (c as any)?.answers?.visibility;
    if (!c || vis !== "public") return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // One open report per user per target to prevent spam.
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_id", target_id)
    .eq("status", "open")
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, reason: "already_reported" });

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type,
    target_id,
    reason,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}