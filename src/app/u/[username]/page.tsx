import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getProfilePublicAnswers } from "@/lib/queries";
import { Avatar, Badge, Card, EmptyState, LevelBadge } from "../../components/ui";
import { shortDate } from "@/lib/utils";

export const revalidate = 0;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await getProfile(supabase, username);
  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const answers = await getProfilePublicAnswers(supabase, profile.id);
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("achievement:achievements(slug, name, description)")
    .eq("user_id", profile.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="p-6 mb-6 animate-fade-up">
        <div className="flex items-start gap-4">
          <Avatar name={profile.display_name ?? profile.username} src={profile.avatar_url} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-muted text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2 text-foreground/80">{profile.bio}</p>}
          </div>
          {isOwner && (
            <a
              href="/settings"
              className="text-sm text-muted hover:text-foreground rounded-[var(--radius-sm)] border px-3 py-1.5"
            >
              Edit
            </a>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6 text-center">
          <Stat label="Answered" value={profile.answers_count} />
          <Stat label="Public" value={profile.public_answers_count} />
          <Stat label="Points" value={profile.confidence_points} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <LevelBadge level={profile.confidence_level} points={profile.confidence_points} />
          {achievements && achievements.length > 0 && (
            achievements.slice(0, 6).map((a: any) => (
              <Badge key={a.achievement.slug} tone="accent" title={a.achievement.description}>
                {a.achievement.name}
              </Badge>
            ))
          )}
        </div>
      </Card>

      <h2 className="font-display text-lg font-semibold mb-3">Recent public answers</h2>
      {answers.length === 0 ? (
        <EmptyState title="No public answers yet" icon="🤫">
          {isOwner ? "Your public answers will show up here." : "This person keeps their answers private."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {answers.map((a) => (
            <Card key={a.id} className="p-4 animate-fade-up">
              <p className="text-xs text-subtle mb-1">{shortDate(a.question.scheduled_date ?? a.created_at)}</p>
              <p className="font-display font-medium text-sm text-muted mb-2">
                {a.question.prompt}
              </p>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{a.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-surface-2 py-3">
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-xs text-subtle">{label}</div>
    </div>
  );
}