import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

// POST /api/admin/reports/[id] — resolve (status=resolved) or dismiss (status=dismissed).
const Body = z.object({
  status: z.enum(["resolved", "dismissed"]),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Forbidden" }, { status: guard.status });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await guard.supabase
    .from("reports")
    .update({ status: parsed.data.status })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}