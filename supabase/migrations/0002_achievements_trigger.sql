-- ============================================================================
-- Questista — achievement auto-awarding
-- Triggered after an answer insert. Idempotent: re-runs are cheap (INSERT ... ON
-- CONFLICT do nothing). Awards badges at content + level milestones.
-- ============================================================================

create or replace function public.check_achievements_for(p_user uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_answers int;
  v_public int;
  v_points int;
  v_level text;
begin
  select answers_count, public_answers_count, confidence_points, confidence_level
    into v_answers, v_public, v_points, v_level
    from profiles where id = p_user;

  if v_answers >= 1 then
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where slug = 'first_answer'
    on conflict do nothing;
  end if;

  if v_public >= 1 then
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where slug = 'first_public'
    on conflict do nothing;
  end if;

  if v_answers >= 10 then
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where slug = 'ten_answers'
    on conflict do nothing;
  end if;

  if v_level = 'Explorer' or v_points >= 50 then
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where slug = 'explorer'
    on conflict do nothing;
  end if;

  if v_level = 'Conversationalist' or v_points >= 400 then
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where slug = 'conversationalist'
    on conflict do nothing;
  end if;

  if v_points >= 1800 then
    insert into user_achievements (user_id, achievement_id)
    select p_user, id from achievements where slug = 'thought_leader'
    on conflict do nothing;
  end if;
end;
$$;

-- Run after the answer trigger (which updates profiles counters + points).
-- The trigger name ordering is alphabetical in Postgres, so this is appended
-- and fires after handle_new_answer for the same event.
create or replace function public.handle_answer_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.check_achievements_for(new.user_id);
  return new;
end;
$$;

drop trigger if exists on_answer_achievements on public.answers;
create trigger on_answer_achievements
  after insert on public.answers
  for each row execute function public.handle_answer_achievements();