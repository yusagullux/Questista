import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayKey, nowISO } from "./datetime";

// Google Gemini provider. The env var is named GEMINI_API_KEY (not the provider's
// default GOOGLE_GENERATIVE_AI_API_KEY), so we instantiate explicitly with the key.
function makeGoogle() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Model fallback chain, newest first. `gemini-flash-latest` intermittently
 * 503s and the 2.x flash models are deprecated ("no longer available to new
 * users"); we try the current 3.x flash family and fall back across entries
 * on overload/quota. Override the head of the chain with GEMINI_MODEL.
 */
const MODEL_CHAIN: string[] = (
  process.env.GEMINI_MODEL ?? "gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const CATEGORIES = [
  "fun",
  "life",
  "creativity",
  "school",
  "technology",
  "future",
  "opinions",
  "hypotheticals",
  "random",
  "personal_growth",
] as const;

const QUESTION_SCHEMA = z.object({
  prompt: z
    .string()
    .min(8)
    .max(240)
    .describe("A single thought-provoking question, no quotation marks, no prefixes."),
  category: z.enum(CATEGORIES),
  rationale: z
    .string()
    .max(160)
    .describe("One short line on why this question is interesting (internal only)."),
});

export type GeneratedQuestion = z.infer<typeof QUESTION_SCHEMA>;

const SYSTEM_PROMPT = `You are the question curator for Questista, a daily social app where every user answers one question a day.

Write ONE question. Rules:
- Interesting, thought-provoking, safe for a general audience, easy to answer.
- Never extremely personal, invasive, political, religious, or NSFW.
- Not repetitive — avoid the RECENT QUESTIONS list below.
- Vary tone: sometimes funny, sometimes serious, sometimes creative.
- Phrased as a question, no quotation marks, no "Q:" prefix, no leading emoji.
- Answerable in a sentence or two.`;

/** Compute a simple token-overlap similarity (Jaccard) between two prompts. */
function similarity(a: string, b: string): number {
  const toks = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
  const A = toks(a);
  const B = toks(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((t) => {
    if (B.has(t)) inter++;
  });
  return inter / (A.size + B.size - inter);
}

/** Returns true if a prompt is too similar to any existing question. */
export function isDuplicate(
  prompt: string,
  existing: { prompt: string }[],
  threshold = 0.55,
): { duplicate: boolean; similarTo?: string } {
  for (const e of existing) {
    const s = similarity(prompt, e.prompt);
    if (s >= threshold) return { duplicate: true, similarTo: e.prompt };
  }
  return { duplicate: false };
}

/** True if the error looks like a transient provider outage we should retry on / skip past. */
function isTransientError(e: unknown): boolean {
  const msg = (e as any)?.message?.toLowerCase?.() ?? "";
  return (
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("503") ||
    msg.includes("failed after")
  );
}

/**
 * Run `generateObject` across the model fallback chain, skipping models that
 * fail transiently. Throws the last error only if every model fails.
 */
async function generateWithFallback(
  recentBlock: string,
  temperature: number,
  nudge = false,
): Promise<GeneratedQuestion> {
  const google = makeGoogle();
  let lastErr: unknown;
  for (const modelId of MODEL_CHAIN) {
    try {
      const { object } = await generateObject({
        model: google(modelId),
        system: SYSTEM_PROMPT,
        prompt: nudge
          ? `Generate a fresh, unusual daily question unlike anything in RECENT QUESTIONS. Pick an unexpected angle.${recentBlock}`
          : `Generate a fresh daily question for Questista.${recentBlock}`,
        schema: QUESTION_SCHEMA,
        temperature,
      });
      return object;
    } catch (e: any) {
      lastErr = e;
      // Only retry the *next* model if this one failed transiently; for
      // hard errors (bad schema, auth) we still fall through but keep going.
      if (!isTransientError(e)) {
        // A non-transient error on the first viable model is still worth
        // trying the next model — but remember the error.
      }
    }
  }
  throw lastErr ?? new Error("All models failed to generate a question.");
}

/**
 * Generate one fresh question, checking it against recent questions for dedup.
 * Retries up to 3 times if the LLM returns a near-duplicate, walking the
 * model chain on transient failures.
 */
export async function generateDailyQuestion(
  service: SupabaseClient,
): Promise<GeneratedQuestion & { attempts: number }> {
  const { data: recent } = await service
    .from("questions")
    .select("prompt")
    .order("created_at", { ascending: false })
    .limit(120);

  const recentList = (recent ?? []) as { prompt: string }[];
  const recentBlock =
    recentList.length > 0
      ? `\nRECENT QUESTIONS (do not repeat or paraphrase these):\n${recentList
          .slice(0, 60)
          .map((q, i) => `${i + 1}. ${q.prompt}`)
          .join("\n")}`
      : "";

  let attempts = 0;
  let lastObject: GeneratedQuestion | null = null;
  for (let i = 0; i < 3; i++) {
    attempts++;
    const object = await generateWithFallback(recentBlock, 0.9);
    lastObject = object;
    const dup = isDuplicate(object.prompt, recentList);
    if (!dup.duplicate) return { ...object, attempts };
    // try again with a nudge
  }
  // Final attempt with a stronger nudge at higher temperature.
  const object = await generateWithFallback(recentBlock, 1, true);
  return { ...object, attempts };
}

/**
 * Ensure the current Estonian day has a published question.
 *
 * Strategy (resilient to AI downtime):
 *  1. Idempotent: if today already has a published/scheduled question, return it.
 *  2. Prefer scheduling an existing draft (cheap, decouples serving from
 *     generation — the daily buffer cron keeps drafts stocked).
 *  3. Only if no draft is available, generate a fresh one via the LLM.
 *
 * This means a transient Gemini outage never leaves the day empty: drafts cover
 * it, and the hourly cron retries fresh generation until the buffer is refilled.
 */
export async function ensureTodayQuestion(
  service: SupabaseClient,
): Promise<{
  created: boolean;
  scheduled?: boolean;
  question?: { id: string; prompt: string; category: string };
  reason?: string;
  error?: string;
}> {
  const today = todayKey();

  const { data: todays } = await service
    .from("questions")
    .select("id, prompt, category")
    .eq("scheduled_date", today)
    .maybeSingle();
  if (todays) {
    return { created: false, question: todays as any, reason: "today_already_has_question" };
  }

  // 2) Schedule the oldest available draft for today.
  const { data: draft } = await service
    .from("questions")
    .select("id, prompt, category")
    .eq("status", "draft")
    .is("scheduled_date", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (draft) {
    const { data, error } = await service
      .from("questions")
      .update({ status: "published", scheduled_date: today, published_at: nowISO() })
      .eq("id", (draft as any).id)
      .select("id, prompt, category")
      .single();
    if (error) return { created: false, error: error.message };
    return { created: true, scheduled: true, question: data as any, reason: "scheduled_from_draft" };
  }

  // 3) No drafts — generate fresh.
  try {
    const q = await generateDailyQuestion(service);
    const { data, error } = await service
      .from("questions")
      .insert({
        prompt: q.prompt,
        category: q.category,
        status: "published",
        source: "ai",
        model: MODEL_CHAIN[0],
        scheduled_date: today,
        published_at: nowISO(),
      })
      .select("id, prompt, category")
      .single();
    if (error) return { created: false, error: error.message };
    return { created: true, question: data as any, reason: "generated" };
  } catch (e: any) {
    return {
      created: false,
      error: e?.message ?? "Generation failed. Check GEMINI_API_KEY / model availability.",
    };
  }
}

/** Desired minimum number of draft questions to keep in reserve. */
export const DRAFT_BUFFER_TARGET = Number(process.env.DRAFT_BUFFER_TARGET ?? 7);

/**
 * Top up the draft buffer so there are always `DRAFT_BUFFER_TARGET` unscheduled
 * drafts ready to be scheduled if the LLM is down on a future day.
 */
export async function refreshDraftBuffer(
  service: SupabaseClient,
): Promise<{ inserted: number; target: number; current: number; error?: string }> {
  const { count } = await service
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft")
    .is("scheduled_date", null);

  const current = count ?? 0;
  const needed = Math.max(0, DRAFT_BUFFER_TARGET - current);
  if (needed === 0) return { inserted: 0, target: DRAFT_BUFFER_TARGET, current };

  const { data: recent } = await service
    .from("questions")
    .select("prompt")
    .order("created_at", { ascending: false })
    .limit(200);
  const recentList = (recent ?? []) as { prompt: string }[];
  const recentBlock =
    recentList.length > 0
      ? `\nExisting questions (do not repeat):\n${recentList
          .slice(0, 80)
          .map((q) => `- ${q.prompt}`)
          .join("\n")}`
      : "";

  let inserted = 0;
  for (let i = 0; i < needed; i++) {
    try {
      const object = await generateWithFallback(recentBlock, 0.95);
      if (isDuplicate(object.prompt, recentList).duplicate) continue;
      const { error } = await service.from("questions").insert({
        prompt: object.prompt,
        category: object.category,
        status: "draft",
        source: "ai",
        model: MODEL_CHAIN[0],
      });
      if (!error) {
        inserted++;
        recentList.push({ prompt: object.prompt });
      }
    } catch {
      // If generation fails partway, keep what we have — the next run continues.
      break;
    }
  }
  return { inserted, target: DRAFT_BUFFER_TARGET, current: current + inserted };
}