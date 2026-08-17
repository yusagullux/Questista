-- ============================================================================
-- Align the app's day boundary to Europe/Tallinn (Estonia, EET/EEST + DST).
-- Previously, daily-return reset and reaction-cap reset used now()::date, which
-- is the DB session date (UTC on Supabase) — so "daily" reset at UTC midnight,
-- 2–3h off the Estonian midnight users actually experience. This makes streaks
-- and daily rewards consistent with the question day (see src/lib/datetime.ts).
-- ============================================================================

-- A single, reusable "what day is it in the app timezone?" function.
create or replace function public.app_today()
returns date language sql stable as $$
  select ((now() at time zone 'Europe/Tallinn')::date);
$$;

-- Daily-return bonus: once per app-day. Cast created_at to the app tz before
-- extracting the date so both sides of the comparison share the same boundary.
create or replace function public.handle_new_answer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  awarded integer := 0;
  daily_already boolean;
begin
  if new.visibility <> 'skipped' then
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

  select exists (
    select 1 from point_transactions
     where user_id = new.user_id and reason = 'daily_return'
       and ((created_at at time zone 'Europe/Tallinn')::date) = public.app_today()
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

-- Reaction points: cap at 20 per app-day from reactions (same boundary).
create or replace function public.handle_new_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author uuid;
  today_count integer;
begin
  select user_id into author from answers where id = new.answer_id;
  if author is null or author = new.user_id then
    return new;
  end if;
  select count(*) into today_count
    from point_transactions
   where user_id = author and reason = 'reaction_received'
     and ((created_at at time zone 'Europe/Tallinn')::date) = public.app_today();
  if today_count < 20 then
    perform public.award_confidence(author, 1, 'reaction_received', 'answer', new.answer_id);
  end if;
  return new;
end;
$$;