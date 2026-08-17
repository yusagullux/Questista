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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 animate-stamp-in">
        <div className="flex items-center justify-between border-y border-border py-2 mb-5">
          <span className="masthead">Your calendar</span>
          <span className="masthead">{p.answers_count} answered</span>
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          The record so far
        </h1>
        <p className="text-muted text-sm mt-2">A quiet log of the questions you've met.</p>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <LevelBadge level={p.confidence_level} points={p.confidence_points} />
        </div>
        {nl && (
          <div>
            <div className="flex justify-between masthead text-[0.625rem] mb-1.5">
              <span>Next · {nl.name}</span>
              <span>{nl.pointsToNext} pts to go</span>
            </div>
            {/* Ink-fill progress: stamp-red → ochre */}
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden border border-border">
              <div
                className="h-full transition-all"
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