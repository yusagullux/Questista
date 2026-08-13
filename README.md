# Questista

> One question a day. Many perspectives.

Every day, every user gets the same question. Answer it publicly or privately,
skip it, and watch your confidence grow over time — no streaks, no pressure.

## Stack

- **Next.js 16** (App Router, Server Components) + **TypeScript**
- **Tailwind CSS v4** (CSS-first design tokens)
- **Supabase** — Postgres + Auth (Google / GitHub / email) + **Row-Level Security**
- **Vercel AI SDK** (Google Gemini) for daily-question generation with near-duplicate rejection
- Deploys to **Vercel** (cron generates each day's question)

## Why this stack

Private answers are protected **at the database layer** by Supabase RLS, not just
hidden in the UI — the decisive reason for choosing Supabase over Firebase or a
self-hosted setup. Auth for Google + email + GitHub ships in one integration.

## Getting started

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project.
2. **SQL Editor** → run the migration files in order:
   - `supabase/migrations/0001_init.sql` (tables, RLS, Confidence Point logic)
   - `supabase/migrations/0002_achievements_trigger.sql` (achievement auto-awarding)
3. Project Settings → **API** → copy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (keep secret)

### 2. Enable auth providers
- Settings → Authentication → Providers → enable **Email**, **Google**, **GitHub**.
- Add redirect URLs: `http://localhost:3000/auth/callback` and your prod URL.

### 3. Get an AI key
- Google Gemini API key (for question generation) from Google AI Studio.
  Any AI-SDK-compatible provider works — edit `src/lib/ai.ts` to swap.

### 4. Configure environment
```bash
cp .env.local.example .env.local
# fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   GEMINI_API_KEY
#   CRON_SECRET            (any random string — protects the cron route)
```

### 5. Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run seed         # optional: seed 10 curated questions
```

### 6. Make yourself an admin
After signing up, in Supabase SQL Editor:
```sql
update profiles set is_admin = true where username = 'your_username';
```
Then visit `/admin` to generate questions and view stats.

## Architecture

### Database (RLS-secured)
| Table | Notes |
|---|---|
| `profiles` | extends `auth.users`; username, bio, confidence_points/level, counters |
| `questions` | daily prompts; `scheduled_date` (unique), status, source, embedding slot |
| `answers` | `visibility` ∈ `public`/`private`/`skipped`; unique per user+question |
| `reactions` | one per user+answer+type |
| `comments` | on public answers |
| `reports` / `moderation_flags` | safety pipeline |
| `achievements` / `user_achievements` | badge catalog + awards |
| `point_transactions` | append-only audit log; only `SECURITY DEFINER` fns can write |

**RLS highlights**
- Public answers readable by anyone (incl. anon → SEO). Private/skipped answers
  readable **only by the owner** at the DB level.
- `point_transactions` has no INSERT/UPDATE/DELETE policy → users can never award
  themselves points. Only `award_confidence()` (SECURITY DEFINER) can.
- Confidence levels are monotonic — they never demote.

### Confidence Points
Awarded by triggers: answer (+3), public bonus (+2), long-answer (+1), daily
return (+2, once/day, even on skip), received reaction (+1, capped 20/day).
Levels: Curious → Explorer → Contributor → Conversationalist → Confident → Thought Leader.

### AI question generation
- `src/lib/ai.ts` — `generateObject` with a Zod schema + a system prompt enforcing
  safety/variety. Dedup via Jaccard token-overlap against the last 120 questions.
- `ensureTodayQuestion()` runs from:
  - the daily **cron** (`/api/cron/generate-today`, protected by `CRON_SECRET`)
  - the **admin** UI (`/admin`)
- Questions can be generated ahead of time as drafts and scheduled.

## Testing the MVP end-to-end

After wiring real keys, verify:
1. **Auth** — signup (email), login, Google, GitHub, logout, reset password.
2. **Today's question** renders; composer defaults to **Private**.
3. **Public/Private/Skip** — submit each; confirm the public banner is loud.
4. **Feed** shows public answers; like toggles + count updates.
5. **Private answers never appear** in the feed or on the profile.
6. **Calendar** lists history with visibility badges + search/filter.
7. **Confidence Points** increment on the profile + calendar progress bar.
8. **Admin** — generate today's question; stats update.
9. **Security** — confirm RLS: a second account can't read another's private answer.
10. **Mobile** — responsive across breakpoints; reduced-motion respected.

## Project structure
```
src/
  app/
    api/            answers, reactions, questions/generate, cron, auth, account
    auth/callback/  OAuth code exchange
    components/      ui, nav, answer-composer, answer-card, calendar-filter, history-list
    u/[username]/   public profile
    calendar/        personal history + progress
    admin/           moderator dashboard
    settings/        profile edit + password reset + delete account
  lib/
    supabase/        server (RLS) + client + service-role clients
    ai.ts            question generation + dedup
    queries.ts       server-side data fetchers
    confidence.ts    level math (mirrors SQL)
    types.ts         DB row types
supabase/migrations/0001_init.sql
vercel.json          daily cron
```

## Product philosophy
Questista is not about scrolling. It's about answering one meaningful question
and seeing how other people think. Every feature serves that idea.