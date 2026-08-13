import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// GET open reports with their target content + author resolved for display.
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  const supabase = guard.supabase;

  const { data: reports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, status, created_at, reporter_id")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (!reports || reports.length === 0) return NextResponse.json({ reports: [] });

  const answerIds = (reports as any[]).filter((r) => r.target_type === "answer").map((r) => r.target_id);
  const commentIds = (reports as any[]).filter((r) => r.target_type === "comment").map((r) => r.target_id);

  const [aRes, cRes] = await Promise.all([
    answerIds.length
      ? supabase.from("answers").select("id, content, visibility, user_id, profiles:profiles!user_id(username)").in("id", answerIds)
      : Promise.resolve({ data: [] }),
    commentIds.length
      ? supabase.from("comments").select("id, content, user_id, profiles:profiles!user_id(username)").in("id", commentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const aMap = new Map((aRes.data as any[] ?? []).map((a) => [a.id, a]));
  const cMap = new Map((cRes.data as any[] ?? []).map((c) => [c.id, c]));

  const out = (reports as any[]).map((r) => {
    const target = r.target_type === "answer" ? aMap.get(r.target_id) : cMap.get(r.target_id);
    return { ...r, target };
  });

  return NextResponse.json({ reports: out });
}