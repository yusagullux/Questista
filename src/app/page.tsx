import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTodayQuestion, getUserAnswer, getFeedForQuestion } from "@/lib/queries";
import { AnswerComposer } from "./components/answer-composer";
import { AnswerCard } from "./components/answer-card";
import { EmptyState, Badge } from "./components/ui";
import { almanacDate, editionNumber } from "@/lib/utils";

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

  const dayKey = question.scheduled_date ?? question.published_at ?? question.created_at;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Question",
            headline: question.prompt,
            text: question.prompt,
            dateCreated: question.created_at,
            author: { "@type": "Organization", name: "Questista" },
            suggestedAnswer: feed
              .filter((a) => a.content)
              .slice(0, 10)
              .map((a) => ({
                "@type": "Answer",
                text: a.content,
                dateCreated: a.created_at,
                author: {
                  "@type": "Person",
                  name: a.profiles?.display_name ?? a.profiles?.username ?? "Anonymous",
                },
              })),
          }),
        }}
      />

      {/* ── Dated masthead ── the front page of today's edition */}
      <div className="flex items-center justify-between border-y border-border py-2 mb-7 animate-stamp-in">
        <span className="masthead">Questista · No. {editionNumber(dayKey)}</span>
        <span className="masthead">{almanacDate(dayKey)}</span>
      </div>

      {/* ── Today's question — the front-page headline ── */}
      <section className="mb-8 animate-fade-up">
        <p className="masthead mb-3">{formatCategory(question.category)}</p>
        <h1 className="font-display text-3xl sm:text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-left">
          {question.prompt}
        </h1>
        <div className="mt-5 h-px w-16 bg-primary" aria-hidden />
      </section>

      {/* ── Answer or status ── */}
      <section className="mb-10">
        {!user ? (
          <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-7 sm:p-8 text-center">
            <h2 className="font-display text-xl font-semibold mb-1">Join the conversation</h2>
            <p className="text-muted text-sm mb-5 max-w-sm mx-auto">
              Create a free account to answer today's question and see how others think.
            </p>
            <div className="flex justify-center gap-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary text-primary-contrast text-sm font-medium px-5 py-3 hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border-strong text-sm font-medium px-5 py-3 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Log in
              </Link>
            </div>
          </div>
        ) : existing ? (
          <AnsweredStatus answer={existing} dayKey={dayKey} />
        ) : (
          <AnswerComposer question={question} />
        )}
      </section>

      {/* ── Community answers — broadsheet section rule ── */}
      <section>
        <div className="rule-label mb-4">
          <span>
            {feed.length} perspective{feed.length === 1 ? "" : "s"}
          </span>
        </div>

        {feed.length === 0 ? (
          <EmptyState title="Be the first perspective today" icon="✍️">
            No public answers yet. Your answer could start the conversation.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {feed.map((a) => (
              <AnswerCard key={a.id} answer={a} viewerUsername={viewerUsername} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AnsweredStatus({
  answer,
  dayKey,
}: {
  answer: any;
  dayKey: string;
}) {
  const map = {
    public: { label: "Public", text: "Your answer is live in the feed." },
    private: { label: "Private", text: "Saved to your calendar. Only you can see it." },
    skipped: { label: "Skipped", text: "You skipped today. No pressure." },
  } as const;
  const s = map[answer.visibility as keyof typeof map] ?? map.private;
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-5 animate-fade-up">
      <div className="flex items-center gap-3 mb-3">
        <span className="stamp stamp--filled">{almanacDate(dayKey).split(" ").slice(0, 2).join(" ")}</span>
        <div className="min-w-0">
          <p className="font-medium text-sm">You answered today</p>
          <p className="text-xs text-muted">{s.text}</p>
        </div>
        <Badge tone="neutral" className="ml-auto capitalize">{s.label}</Badge>
      </div>
      {answer.content && (
        <p className="prose-entry whitespace-pre-wrap text-foreground border-t border-border pt-3">
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