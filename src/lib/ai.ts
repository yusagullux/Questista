import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// Google Gemini provider. The env var is named GEMINI_API_KEY (not the provider's
// default GOOGLE_GENERATIVE_AI_API_KEY), so we instantiate explicitly with the key.
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });
const DEFAULT_MODEL = "gemini-flash-latest";

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

/**
 * Generate one fresh question, checking it against recent questions for dedup.
 * Uses the service-role client so it can read all questions regardless of status.
 * Retries up to 3 times if the LLM returns a near-duplicate.
 */
export async function generateDailyQuestion(
  service: SupabaseClient,
  opts: { model?: string } = {},
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

  const model = google(opts.model ?? DEFAULT_MODEL);
  let attempts = 0;
  for (let i = 0; i < 3; i++) {
    attempts++;
    const { object } = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      prompt: `Generate a fresh daily question for Questista.${recentBlock}`,
      schema: QUESTION_SCHEMA,
      temperature: 0.9,
    });
    const dup = isDuplicate(object.prompt, recentList);
    if (!dup.duplicate) return { ...object, attempts };
    // try again with a nudge
  }
  // Fall through: return the last object even if flagged (admin can reject).
  const { object } = await generateObject({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Generate a fresh, unusual daily question unlike anything in RECENT QUESTIONS. Pick an unexpected angle.${recentBlock}`,
    schema: QUESTION_SCHEMA,
    temperature: 1,
  });
  return { ...object, attempts };
}

/** Ensure today has a published question. If none exists, generate + publish one. */
export async function ensureTodayQuestion(
  service: SupabaseClient,
): Promise<{ created: boolean; question?: { id: string; prompt: string; category: string }; reason?: string; error?: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: todays } = await service
    .from("questions")
    .select("id, prompt, category")
    .eq("scheduled_date", today)
    .maybeSingle();
  if (todays) {
    return { created: false, reason: "today_already_has_question", question: todays as any };
  }

  try {
    const q = await generateDailyQuestion(service);
    const { data, error } = await service
      .from("questions")
      .insert({
        prompt: q.prompt,
        category: q.category,
        status: "published",
        source: "ai",
        model: DEFAULT_MODEL,
        scheduled_date: today,
        published_at: new Date().toISOString(),
      })
      .select("id, prompt, category")
      .single();
    if (error) return { created: false, error: error.message };
    return { created: true, question: data as any };
  } catch (e: any) {
    return { created: false, error: e?.message ?? "Generation failed. Check GEMINI_API_KEY." };
  }
}

/** Generate N questions ahead of time and insert them as 'draft' (to be scheduled). */
export async function generateQuestionBatch(
  service: SupabaseClient,
  count: number,
): Promise<{ inserted: number; skippedDuplicates: number }> {
  let inserted = 0;
  let skippedDuplicates = 0;
  const { data: recent } = await service
    .from("questions")
    .select("prompt")
    .order("created_at", { ascending: false })
    .limit(200);
  const recentList = (recent ?? []) as { prompt: string }[];

  for (let i = 0; i < count; i++) {
    const model = google(DEFAULT_MODEL);
    const { object } = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      prompt: `Generate fresh daily question #${i + 1} of ${count} for Questista. Make it distinct from the others you generate and from:\n${recentList
        .slice(0, 80)
        .map((q) => `- ${q.prompt}`)
        .join("\n")}`,
      schema: QUESTION_SCHEMA,
      temperature: 0.95,
    });
    if (isDuplicate(object.prompt, [...recentList, ...[]]).duplicate) {
      skippedDuplicates++;
      continue;
    }
    const { error } = await service.from("questions").insert({
      prompt: object.prompt,
      category: object.category,
      status: "draft",
      source: "ai",
      model: DEFAULT_MODEL,
    });
    if (!error) {
      inserted++;
      recentList.push({ prompt: object.prompt });
    }
  }
  return { inserted, skippedDuplicates };
}