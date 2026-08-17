-- Pin search_path on app_today (introduced in 0005) so a hostile search_path can't
-- shadow its (minimal) name resolution. Matches the handle_new_* functions, which
-- already set search_path = public. Addresses Supabase security advisor
-- 0011_function_search_path_mutable for public.app_today.
create or replace function public.app_today()
returns date language sql stable
set search_path = public as $$
  select ((now() at time zone 'Europe/Tallinn')::date);
$$;