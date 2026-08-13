// End-to-end smoke test: exercises the exact DB ops + RLS + triggers that the
// /api/answers, /api/reactions, /api/comments routes perform, authenticated as
// real test users. Verifies the core beta loop: answer → feed → react → comment
// → RLS privacy → calendar → profile. Cleans up after itself.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = Math.random().toString(36).slice(2, 8);
const A_EMAIL = `qbeta.a.${stamp}@gmail.com`;
const B_EMAIL = `qbeta.b.${stamp}@gmail.com`;
const A_USER = `qbeta_a_${stamp}`;
const B_USER = `qbeta_b_${stamp}`;
const PW = "beta-test-1234";
const fails = [];
function check(name, cond, detail = "") {
  const ok = !!cond;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) fails.push(name);
}

async function makeUser(email, username) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PW,
    email_confirm: true,
    user_metadata: { username, full_name: username },
  });
  if (error) throw new Error("createUser " + email + ": " + error.message);
  return data.user.id;
}

async function anonLogin(email) {
  const c = createClient(url, anonKey);
  const { data, error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw new Error("login " + email + ": " + error.message);
  return c;
}

// --- setup: two test users ---
const idA = await makeUser(A_EMAIL, A_USER);
const idB = await makeUser(B_EMAIL, B_USER);
const clientA = await anonLogin(A_EMAIL);
const clientB = await anonLogin(B_EMAIL);
console.log("setup: A=" + A_USER + " B=" + B_USER);

// --- get today's question (published) ---
const { data: q } = await admin
  .from("questions")
  .select("id, prompt")
  .eq("status", "published")
  .order("published_at", { ascending: false })
  .limit(1)
  .maybeSingle();
check("today's question exists", !!q, q?.prompt ?? "none");

// --- A answers publicly ---
const { data: ansA, error: ansErr } = await clientA
  .from("answers")
  .insert({ user_id: idA, question_id: q.id, content: "Public test answer from A — unique.", visibility: "public" })
  .select("id, visibility")
  .single();
check("A inserts PUBLIC answer (RLS allows)", !ansErr, ansErr?.message ?? "");
const answerId = ansA?.id;

// --- profile counters + points (trigger handle_new_answer) ---
const { data: profA } = await admin.from("profiles").select("answers_count, public_answers_count, confidence_points").eq("id", idA).maybeSingle();
check("profile answers_count == 1", profA?.answers_count === 1, String(profA?.answers_count));
check("profile public_answers_count == 1", profA?.public_answers_count === 1, String(profA?.public_answers_count));
check("confidence_points awarded (>0)", (profA?.confidence_points ?? 0) > 0, String(profA?.confidence_points));
const { count: txCount } = await admin.from("point_transactions").select("*", { count: "exact", head: true }).eq("user_id", idA);
check("point_transactions audit row exists", txCount > 0, String(txCount));

// --- B reacts (like) to A's answer (triggers handle_new_reaction → A +1) ---
const { error: reactErr } = await clientB.from("reactions").insert({ answer_id: answerId, user_id: idB, type: "like" });
check("B inserts reaction (RLS allows)", !reactErr, reactErr?.message ?? "");

// --- B comments on A's answer ---
const { data: comment, error: commentErr } = await clientB.from("comments").insert({ answer_id: answerId, user_id: idB, content: "Great perspective!" }).select("id").single();
check("B inserts comment (RLS allows)", !commentErr, commentErr?.message ?? "");

// --- feed: public answers for the question include A's answer + reaction count ---
// No direct FK answers→profiles (both reference auth.users), so the
// PostgREST join errors and returns null — select without the join.
const { data: feed } = await clientA
  .from("answers")
  .select("id, visibility")
  .eq("question_id", q.id)
  .eq("visibility", "public");
const inFeed = feed?.some((a) => a.id === answerId);
check("A's public answer appears in feed", inFeed, "feed len=" + (feed?.length ?? 0));

// reactions visible in feed fetch
const { data: feedReactions } = await clientA.from("reactions").select("answer_id, user_id").in("answer_id", [answerId]);
check("reaction is readable in feed", (feedReactions?.length ?? 0) >= 1, String(feedReactions?.length ?? 0));

// --- RLS privacy: A switches to PRIVATE; B must NOT see it, A still sees own ---
await clientA.from("answers").update({ visibility: "private" }).eq("id", answerId);
const { data: bSeesPrivate } = await clientB.from("answers").select("id").eq("question_id", q.id).eq("visibility", "private");
check("B CANNOT see A's private answer (RLS)", !bSeesPrivate?.some((a) => a.id === answerId), "B sees " + (bSeesPrivate?.length ?? 0));
const { data: aSeesOwn } = await clientA.from("answers").select("id, visibility").eq("id", answerId).maybeSingle();
check("A still sees own private answer", aSeesOwn?.id === answerId && aSeesOwn?.visibility === "private");

// --- calendar/history (A's own answers, any visibility) ---
const { data: history } = await clientA.from("answers").select("id, visibility").eq("user_id", idA);
check("calendar/history: A sees own answer", (history?.length ?? 0) >= 1, "count=" + (history?.length ?? 0));

// --- public profile answers (A's is now private → should be empty for B) ---
const { data: publicAnswers } = await clientB.from("answers").select("id").eq("user_id", idA).eq("visibility", "public");
check("public profile: A's private answer not shown to B", (publicAnswers?.length ?? 0) === 0, "count=" + (publicAnswers?.length ?? 0));

// --- skip flow: B skips (insert skipped answer) ---
const { error: skipErr } = await clientB.from("answers").insert({ user_id: idB, question_id: q.id, content: null, visibility: "skipped" });
check("B can SKIP (insert visibility=skipped)", !skipErr, skipErr?.message ?? "");

// --- cleanup ---
await admin.from("comments").delete().eq("user_id", idB);
await admin.from("reactions").delete().eq("user_id", idB);
await admin.from("answers").delete().in("user_id", [idA, idB]);
await admin.from("point_transactions").delete().in("user_id", [idA, idB]);
await admin.auth.admin.deleteUser(idA);
await admin.auth.admin.deleteUser(idB);
console.log("cleanup: done");

console.log("\n" + (fails.length === 0 ? "ALL CHECKS PASSED ✅" : `FAILURES (${fails.length}): ` + fails.join(", ")));
process.exit(fails.length === 0 ? 0 : 1);