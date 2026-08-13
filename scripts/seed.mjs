// Seed a few curated questions so the app has content before the first AI run.
// Usage: npm run seed   (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in .env.local.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const seedQuestions = [
  { prompt: "What is one small thing that made you happy today?", category: "life" },
  { prompt: "If you could instantly master one skill, what would it be?", category: "hypotheticals" },
  { prompt: "What's something you learned this week?", category: "personal_growth" },
  { prompt: "What is one opinion you've changed recently?", category: "opinions" },
  { prompt: "If you could travel anywhere right now, where would you go?", category: "hypotheticals" },
  { prompt: "What's a song, book, or film that changed how you see the world?", category: "creativity" },
  { prompt: "What technology do you wish existed?", category: "technology" },
  { prompt: "What's something you'd teach your younger self?", category: "personal_growth" },
  { prompt: "What's a tiny goal you're working toward right now?", category: "life" },
  { prompt: "What's the most unexpectedly useful thing you own?", category: "fun" },
];

// Publish today's; the rest stay draft for scheduling.
const today = new Date().toISOString().slice(0, 10);
const rows = seedQuestions.map((q, i) => ({
  prompt: q.prompt,
  category: q.category,
  status: i === 0 ? "published" : "draft",
  source: "manual",
  scheduled_date: i === 0 ? today : null,
  published_at: i === 0 ? new Date().toISOString() : null,
}));

const { error } = await supabase.from("questions").upsert(rows, { onConflict: "scheduled_date", ignoreDuplicates: true });
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log(`Seeded ${rows.length} questions. Today's is published: "${rows[0].prompt}"`);