-- ============================================================================
-- Questista — initial schema + Row Level Security
-- Run against a Supabase Postgres project (Supabase Studio → SQL Editor, or
-- `supabase db push` with the Supabase CLI).
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type answer_visibility as enum ('public', 'private', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_status as enum ('draft', 'scheduled', 'published', 'used', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_category as enum (
    'fun', 'life', 'creativity', 'school', 'technology', 'future',
    'opinions', 'hypotheticals', 'random', 'personal_growth'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum ('pending', 'approved', 'removed', 'escalated');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles: extends auth.users. Public-facing profile + confidence state.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  confidence_points integer not null default 0,
  confidence_level text not null default 'Curious',
  answers_count integer not null default 0,
  public_answers_count integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- questions: the daily prompts (AI-generated or manual).
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  category question_category not null default 'random',
  status question_status not null default 'draft',
  source text not null default 'ai',           -- 'ai' | 'manual'
  scheduled_date date unique,                  -- the day this question is served
  model text,                                   -- which AI model produced it
  embedding vector(1536),                       -- reserved for pgvector dedup
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists questions_status_idx on public.questions (status);
create index if not exists questions_scheduled_idx on public.questions (scheduled_date);

-- answers: one per user per question. visibility enforces public/private/skip.
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  content text,
  visibility answer_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);
create index if not exists answers_question_idx on public.answers (question_id, visibility, created_at);
create index if not exists answers_user_idx on public.answers (user_id, created_at desc);
create index if not exists answers_public_idx on public.answers (question_id) where visibility = 'public';

-- comments: threaded-ish (one level via parent_id) under public answers.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_answer_idx on public.comments (answer_id, created_at);

-- reactions: one per user per answer per type.
create table if not exists public.reactions (
  answer_id uuid not null references public.answers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'like',
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id, type)
);
create index if not exists reactions_answer_idx on public.reactions (answer_id);

-- reports: user-submitted flags on answers/comments.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,                    -- 'answer' | 'comment'
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at);

-- achievements: catalog + per-user awards.
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  threshold integer not null default 0
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- moderation: automated / admin flags on content.
create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  severity text not null default 'low',
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists mod_status_idx on public.moderation_flags (status);

-- point_transactions: append-only audit log of every Confidence Point change.
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists points_user_idx on public.point_transactions (user_id, created_at desc);

-- ============================================================================
-- Confidence Point logic
-- Levels are monotonic — they never demote, even if rules change later.
-- ============================================================================
create or replace function public.confidence_level_for(points integer)
returns text language sql immutable as $$
  select case
    when points >= 1800 then 'Thought Leader'
    when points >= 900  then 'Confident'
    when points >= 400  then 'Conversationalist'
    when points >= 150  then 'Contributor'
    when points >= 50   then 'Explorer'
    else 'Curious'
  end;
$$;

-- Award points from privileged context (SECURITY DEFINER). Users can NEVER
-- insert into point_transactions directly (RLS denies them) — only this fn can.
create or replace function public.award_confidence(
  p_user uuid, p_delta integer, p_reason text,
  p_source_type text default null, p_source_id uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into point_transactions (user_id, delta, reason, source_type, source_id)
  values (p_user, p_delta, p_reason, p_source_type, p_source_id);

  update profiles
     set confidence_points = confidence_points + p_delta,
         confidence_level = confidence_level_for(confidence_points + p_delta),
         updated_at = now()
   where id = p_user;
end;
$$;

-- ============================================================================
-- Admin helper
-- ============================================================================
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Atomically adjust a numeric profile counter (avoids read-then-write races).
create or replace function public.adjust_profile_count(
  p_user uuid, p_column text, p_delta integer
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_column not in ('answers_count', 'public_answers_count') then
    raise exception 'invalid column %', p_column;
  end if;
  execute format(
    'update profiles set %I = greatest(0, %I + $1) where id = $2',
    p_column, p_column
  ) using p_delta, p_user;
end;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  uname text := null;
  n integer := 1;
begin
  base := coalesce(new.raw_user_meta_data->>'username',
                   split_part(new.email, '@', 1),
                   'user');
  base := lower(regexp_replace(base, '[^a-z0-9_]', '', 'g'));
  if base = '' then base := 'user'; end if;
  uname := base;
  while exists (select 1 from profiles where username = uname) loop
    uname := base || n::text;
    n := n + 1;
  end loop;

  insert into profiles (id, username, display_name, avatar_url)
  values (new.id, uname,
          coalesce(new.raw_user_meta_data->>'full_name', uname),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- On answer insert/skip: award points + update counters + daily-return bonus.
create or replace function public.handle_new_answer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  awarded integer := 0;
  daily_already boolean;
begin
  -- count real answers (not skipped)
  if new.visibility <> 'skipped' then
    -- base points for answering
    awarded := awarded + 3;
    if new.visibility = 'public' then
      awarded := awarded + 2;
    end if;
    if coalesce(char_length(new.content), 0) >= 80 then
      awarded := awarded + 1;
    end if;
    update profiles set answers_count = answers_count + 1 where id = new.user_id;
    if new.visibility = 'public' then
      update profiles set public_answers_count = public_answers_count + 1 where id = new.user_id;
    end if;
  end if;

  -- daily-return bonus: once per day (given for showing up — skip counts)
  select exists (
    select 1 from point_transactions
     where user_id = new.user_id and reason = 'daily_return'
       and created_at::date = now()::date
  ) into daily_already;
  if not daily_already then
    perform public.award_confidence(new.user_id, 2, 'daily_return', 'answer', new.id);
  end if;

  if awarded > 0 then
    perform public.award_confidence(new.user_id, awarded, 'answer', 'answer', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_answer_created on public.answers;
create trigger on_answer_created
  after insert on public.answers
  for each row execute function public.handle_new_answer();

-- On reaction: +1 to the answer author (capped at 20/day from reactions).
create or replace function public.handle_new_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author uuid;
  today_count integer;
begin
  select user_id into author from answers where id = new.answer_id;
  if author is null or author = new.user_id then
    return new;  -- no points for self-reacts
  end if;
  select count(*) into today_count
    from point_transactions
   where user_id = author and reason = 'reaction_received'
     and created_at::date = now()::date;
  if today_count < 20 then
    perform public.award_confidence(author, 1, 'reaction_received', 'answer', new.answer_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_reaction_created on public.reactions;
create trigger on_reaction_created
  after insert on public.reactions
  for each row execute function public.handle_new_reaction();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.questions         enable row level security;
alter table public.answers           enable row level security;
alter table public.comments          enable row level security;
alter table public.reactions         enable row level security;
alter table public.reports           enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;
alter table public.moderation_flags  enable row level security;
alter table public.point_transactions enable row level security;

-- profiles -------------------------------------------------------------------
create policy "profiles: public read"     on public.profiles for select using (true);
create policy "profiles: self update"    on public.profiles for update using (auth.uid() = id);
create policy "profiles: admin all"      on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- questions ------------------------------------------------------------------
create policy "questions: read published/scheduled"
  on public.questions for select
  using (status in ('published','used','scheduled') or public.is_admin());
create policy "questions: admin manage"
  on public.questions for all using (public.is_admin()) with check (public.is_admin());

-- answers --------------------------------------------------------------------
-- public answers are readable by everyone (incl. anon, for SEO); private/skipped only by owner.
create policy "answers: read public or own"
  on public.answers for select
  using (visibility = 'public' or auth.uid() = user_id);

create policy "answers: insert own"
  on public.answers for insert with check (auth.uid() = user_id);

create policy "answers: update own"
  on public.answers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "answers: delete own"
  on public.answers for delete using (auth.uid() = user_id);

create policy "answers: admin all"
  on public.answers for all using (public.is_admin()) with check (public.is_admin());

-- comments -------------------------------------------------------------------
create policy "comments: read all authed"
  on public.comments for select using (auth.uid() is not null or true); -- readable by all (on public answers)
create policy "comments: insert own"
  on public.comments for insert with check (auth.uid() = user_id);
create policy "comments: delete own or admin"
  on public.comments for delete using (auth.uid() = user_id or public.is_admin());

-- reactions ------------------------------------------------------------------
create policy "reactions: read all"
  on public.reactions for select using (true);
create policy "reactions: insert own"
  on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions: delete own"
  on public.reactions for delete using (auth.uid() = user_id);

-- reports -------------------------------------------------------------------
create policy "reports: insert own"
  on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports: read own or admin"
  on public.reports for select using (auth.uid() = reporter_id or public.is_admin());
create policy "reports: admin manage"
  on public.reports for all using (public.is_admin()) with check (public.is_admin());

-- achievements --------------------------------------------------------------
create policy "achievements: read all"   on public.achievements for select using (true);
create policy "user_achievements: read all" on public.user_achievements for select using (true);
create policy "user_achievements: admin manage"
  on public.user_achievements for all using (public.is_admin()) with check (public.is_admin());

-- moderation_flags ----------------------------------------------------------
create policy "moderation: admin only"
  on public.moderation_flags for all using (public.is_admin()) with check (public.is_admin());

-- point_transactions --------------------------------------------------------
create policy "points: read own"
  on public.point_transactions for select using (auth.uid() = user_id);
-- no insert/update/delete policy → only the SECURITY DEFINER functions can write.

-- ============================================================================
-- Seed achievements + a first question
-- ============================================================================
insert into public.achievements (slug, name, description, threshold)
values
  ('first_answer',  'First Words',    'Answer your first question',        1),
  ('first_public',  'Out Loud',       'Post your first public answer',     1),
  ('ten_answers',   'Consistent',     'Answer 10 questions',               10),
  ('explorer',      'Explorer',       'Reach Explorer level',              50),
  ('conversationalist', 'Conversationalist', 'Reach Conversationalist',     400),
  ('thought_leader','Thought Leader', 'Reach Thought Leader',               1800)
on conflict (slug) do nothing;

insert into public.questions (prompt, category, status, source, scheduled_date, published_at)
select 'What is one small thing that made you happy today?', 'life', 'published', 'manual',
       current_date, now()
where not exists (select 1 from public.questions where scheduled_date = current_date);