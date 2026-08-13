import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// DELETE /api/account — deletes the authenticated user + cascade (RLS/cascade handles data).
// Requires service-role admin API (the user cannot delete their own auth.users row directly).
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // profiles / answers / etc. cascade on auth.users delete (FK ON DELETE CASCADE).
  return NextResponse.json({ ok: true });
}