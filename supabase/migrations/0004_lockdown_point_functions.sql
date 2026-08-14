-- 0004_lockdown_point_functions.sql
-- Mutating SECURITY DEFINER helpers (award_confidence, adjust_profile_count,
-- check_achievements_for) and trigger functions (handle_*) were callable by
-- anon/authenticated via PostgREST. Because they take an explicit p_user param
-- with no caller check, any client could inflate anyone's confidence points or
-- counters. Revoke direct EXECUTE so only trigger-invoked (definer context) and
-- service-role callers can use them. is_admin() and confidence_level_for stay
-- public (read-only, used in RLS policies).

revoke execute on function public.award_confidence(uuid, integer, text, text, uuid) from anon, authenticated, public;
revoke execute on function public.adjust_profile_count(uuid, text, integer) from anon, authenticated, public;
revoke execute on function public.check_achievements_for(uuid) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.handle_new_answer() from anon, authenticated, public;
revoke execute on function public.handle_new_reaction() from anon, authenticated, public;
revoke execute on function public.handle_answer_achievements() from anon, authenticated, public;