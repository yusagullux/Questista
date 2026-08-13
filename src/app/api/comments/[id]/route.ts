import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/comments/[id] — owner or admin
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Owner can delete via RLS; admin via RLS. Either way the delete policy covers it.
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    // If not owner/admin, RLS silently affects 0 rows → not an error, but confirm.
    const { data: still } = await supabase.from("comments").select("id").eq("id", id).maybeSingle();
    if (still) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}