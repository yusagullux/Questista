import { createClient } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Returns the authed server client + user if the caller is an admin, else a 401/403 response pair. */
export async function requireAdmin(): Promise<
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; status: number }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };
  const { data: p } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!p?.is_admin) return { ok: false, status: 403 };
  return { ok: true, supabase, userId: user.id };
}