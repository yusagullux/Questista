import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// DELETE /api/admin/comments/[id] — remove a comment (admin).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Forbidden" }, { status: guard.status });

  const { error } = await guard.supabase.from("comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}