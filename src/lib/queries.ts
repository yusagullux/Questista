import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedAnswer, Question, Answer } from "./types";

/** Today's question: the one scheduled for today, else the latest published. */
export async function getTodayQuestion(
  supabase: SupabaseClient,
): Promise<Question | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: byDate } = await supabase
    .from("questions")
    .select("*")
    .eq("scheduled_date", today)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byDate) return byDate as Question;

  const { data: latest } = await supabase
    .from("questions")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (latest as Question) ?? null;
}

export async function getUserAnswer(
  supabase: SupabaseClient,
  userId: string,
  questionId: string,
): Promise<Answer | null> {
  const { data } = await supabase
    .from("answers")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();
  return (data as Answer) ?? null;
}

/**
 * Public feed for a question, with author profile + reaction counts +
 * whether the viewer reacted. Counts are aggregated in JS from a single
 * reactions fetch (avoids needing a view / RPC for MVP).
 */
export async function getFeedForQuestion(
  supabase: SupabaseClient,
  questionId: string,
  viewerId: string | null,
): Promise<FeedAnswer[]> {
  const { data: answers } = await supabase
    .from("answers")
    .select(
      "*, profiles:profiles!user_id(id,username,display_name,avatar_url,confidence_level)",
    )
    .eq("question_id", questionId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!answers || answers.length === 0) return [];

  const ids = answers.map((a: any) => a.id);
  const { data: reactions } = await supabase
    .from("reactions")
    .select("answer_id, user_id")
    .in("answer_id", ids);

  const counts = new Map<string, number>();
  const reacted = new Set<string>();
  for (const r of (reactions ?? []) as any[]) {
    counts.set(r.answer_id, (counts.get(r.answer_id) ?? 0) + 1);
    if (r.user_id === viewerId) reacted.add(r.answer_id);
  }

  return (answers as any[]).map((a) => ({
    ...a,
    reaction_count: counts.get(a.id) ?? 0,
    viewer_reacted: reacted.has(a.id),
  })) as FeedAnswer[];
}

/** A user's answer history (any visibility) for the calendar — owner only (RLS enforces). */
export async function getUserHistory(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("answers")
    .select(
      "id, content, visibility, created_at, question:questions!question_id(id, prompt, category, scheduled_date)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(400);
  return (data as any[]) ?? [];
}

export async function getProfile(supabase: SupabaseClient, username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return data as any;
}

export async function getProfilePublicAnswers(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data } = await supabase
    .from("answers")
    .select(
      "id, content, visibility, created_at, question:questions!question_id(id, prompt, category, scheduled_date)",
    )
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as any[]) ?? [];
}