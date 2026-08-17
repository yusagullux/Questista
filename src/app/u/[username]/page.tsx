import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getProfilePublicAnswers } from "@/lib/queries";
import { Avatar, Badge, Card, EmptyState, LevelBadge } from "../../components/ui";
import { almanacDate } from "@/lib/utils";

export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await getProfile(supabase, username);
  if (!profile) return { title: "Profile not found" };

  const name = profile.display_name ?? profile.username;
  const title = `${name} (@${profile.username})`;
  const description =
    profile.bio?.slice(0, 140) ??
    `${name} answers one question a day on Questista. ${profile.public_answers_count} public perspectives so far.`;

  return {
    title,
    description,
    alternates: { canonical: `/u/${profile.username}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${siteUrl}/u/${profile.username}`,
    },
    twitter: { card: "summary", title, description },
  };
}

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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Card className="p-6 mb-6 animate-fade-up">
        {/* ── Masthead: handle + join rule ── */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
          <span className="masthead">@{profile.username}</span>
          <span className="masthead">Profile</span>
        </div>
        <div className="flex items-start gap-4">
          <Avatar name={profile.display_name ?? profile.username} src={profile.avatar_url} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="masthead text-[0.625rem] mt-1">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2 text-foreground/80">{profile.bio}</p>}
          </div>
          {isOwner && (
            <Link
              href="/settings"
              className="text-sm text-muted hover:text-foreground rounded-[var(--radius-sm)] border border-border px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Edit
            </Link>
          )}
        </div>

        {/* ── Stats — mono numerals with small labels ── */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <Stat label="Answered" value={profile.answers_count} />
          <Stat label="Public" value={profile.public_answers_count} />
          <Stat label="Points" value={profile.confidence_points} />
        </div>

        {/* ── Level + achievements as stamps ── */}
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

      <div className="rule-label mb-4">
        <span>Recent public answers</span>
      </div>
      {answers.length === 0 ? (
        <EmptyState title="No public answers yet" icon="🤫">
          {isOwner ? "Your public answers will show up here." : "This person keeps their answers private."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {answers.map((a) => (
            <Card key={a.id} className="p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-2">
                <span className="stamp stamp--ghost">
                  {almanacDate(a.question.scheduled_date ?? a.created_at).split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
              <p className="font-display font-medium text-sm text-muted mb-2 leading-snug">
                {a.question.prompt}
              </p>
              <p className="prose-entry whitespace-pre-wrap text-foreground border-t border-border pt-2.5">
                {a.content}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-surface-2 py-3 text-center">
      <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="masthead text-[0.625rem] mt-0.5">{label}</div>
    </div>
  );
}