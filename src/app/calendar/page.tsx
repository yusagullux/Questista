import { createClient } from "@/lib/supabase/server";
import { getUserHistory } from "@/lib/queries";
import { Card, EmptyState, LevelBadge } from "../components/ui";
import { CalendarFilter } from "../components/calendar-filter";
import { nextLevel } from "@/lib/confidence";

export const revalidate = 0;

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, history] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getUserHistory(supabase, user.id),
  ]);

  const p = profile as any;
  const nl = nextLevel(p.confidence_points);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 animate-fade-up">
        <h1 className="font-display text-2xl font-semibold mb-1">Your calendar</h1>
        <p className="text-muted text-sm">A quiet record of the questions you've met.</p>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <LevelBadge level={p.confidence_level} points={p.confidence_points} />
          <span className="text-xs text-subtle">{p.answers_count} answered</span>
        </div>
        {nl && (
          <div>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Next: {nl.name}</span>
              <span>{nl.pointsToNext} pts to go</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.round(nl.progress * 100)}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}
              />
            </div>
          </div>
        )}
      </Card>

      {history.length === 0 ? (
        <EmptyState title="Your calendar is empty" icon="🗓️">
          Answer today's question and it'll appear here.
        </EmptyState>
      ) : (
        <CalendarFilter items={history} />
      )}
    </div>
  );
}