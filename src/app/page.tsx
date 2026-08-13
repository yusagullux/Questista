import { createClient } from "@/lib/supabase/server";
import { getTodayQuestion, getUserAnswer, getFeedForQuestion } from "@/lib/queries";
import { AnswerComposer } from "./components/answer-composer";
import { AnswerCard } from "./components/answer-card";
import { EmptyState, Badge } from "./components/ui";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const question = await getTodayQuestion(supabase);

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="No question today yet" icon="🌙">
          The day's question hasn't been published. Check back soon.
        </EmptyState>
      </div>
    );
  }

  const existing = user ? await getUserAnswer(supabase, user.id, question.id) : null;
  const feed = await getFeedForQuestion(supabase, question.id, user?.id ?? null);

  let viewerUsername: string | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    viewerUsername = (p as any)?.username ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Today's question — the central focus */}
      <section className="text-center mb-8 animate-fade-up">
        <Badge tone="primary" className="mb-4">
          {formatCategory(question.category)} · {formatDate(question.scheduled_date ?? question.published_at ?? question.created_at)}
        </Badge>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
          {question.prompt}
        </h1>
      </section>

      {/* Answer or status */}
      <section className="mb-10">
        {!user ? (
          <div className="rounded-[var(--radius)] border bg-primary-soft border-primary/20 p-8 text-center">
            <h2 className="font-display text-xl font-semibold mb-1">Join the conversation</h2>
            <p className="text-muted text-sm mb-5">
              Create a free account to answer today's question and see how others think.
            </p>
            <div className="flex justify-center gap-2">
              <a href="/signup" className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary text-white text-sm font-medium px-5 py-3 hover:bg-primary-hover transition-colors">
                Get started
              </a>
              <a href="/login" className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border text-sm font-medium px-5 py-3 hover:bg-surface-2 transition-colors">
                Log in
              </a>
            </div>
          </div>
        ) : existing ? (
          <AnsweredStatus answer={existing} />
        ) : (
          <AnswerComposer question={question} />
        )}
      </section>

      {/* Community answers */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">
            How others answered
          </h2>
          <span className="text-sm text-subtle">{feed.length} perspective{feed.length === 1 ? "" : "s"}</span>
        </div>

        {feed.length === 0 ? (
          <EmptyState title="Be the first perspective today" icon="✍️">
            No public answers yet. Your answer could start the conversation.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {feed.map((a) => (
              <AnswerCard key={a.id} answer={a} viewerUsername={viewerUsername} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AnsweredStatus({ answer }: { answer: any }) {
  const map = {
    public: { icon: "🌎", label: "Public", text: "Your answer is live in the feed." },
    private: { icon: "🔒", label: "Private", text: "Saved to your calendar. Only you can see it." },
    skipped: { icon: "✓", label: "Skipped", text: "You skipped today. No pressure." },
  } as const;
  const s = map[answer.visibility as keyof typeof map] ?? map.private;
  return (
    <div className="rounded-[var(--radius)] border bg-surface p-5 shadow-sm animate-fade-up">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{s.icon}</span>
        <div>
          <p className="font-medium text-sm">You answered today</p>
          <p className="text-xs text-muted">{s.text}</p>
        </div>
        <Badge tone="neutral" className="ml-auto capitalize">{s.label}</Badge>
      </div>
      {answer.content && (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground border-t pt-3">
          {answer.content}
        </p>
      )}
    </div>
  );
}

function formatCategory(c: string) {
  return c
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}