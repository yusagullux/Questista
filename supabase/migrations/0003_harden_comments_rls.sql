-- 0003_harden_comments_rls.sql
-- Comments were globally readable (using(true)) and insertable on any answer
-- (only checked auth.uid() = user_id). Harden so comments are only visible on
-- PUBLIC answers, and can only be inserted on public answers. Authors still
-- see their own comments even if the answer is later flipped to private.

drop policy if exists "comments: read all authed" on public.comments;
drop policy if exists "comments: insert own" on public.comments;

create policy "comments: read on public answers or own"
  on public.comments for select
  using (
    exists (
      select 1 from public.answers
      where answers.id = comments.answer_id
        and answers.visibility = 'public'
    )
    or auth.uid() = comments.user_id
  );

create policy "comments: insert own on public answer"
  on public.comments for insert
  with check (
    auth.uid() = comments.user_id
    and exists (
      select 1 from public.answers
      where answers.id = comments.answer_id
        and answers.visibility = 'public'
    )
  );