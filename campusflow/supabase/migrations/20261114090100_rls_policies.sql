-- =============================================================================
-- CampusFlow — Row Level Security, privileges and server-side functions
--
-- Principles
--   * RLS is enabled on every table in the public schema.
--   * The anon role has no table privileges at all.
--   * Personal data (courses, tasks, grades...) is visible only to its owner.
--   * Cross-owner references are prevented by composite foreign keys
--     (see core schema), so RLS only needs to check the row owner.
--   * Columns that must never be set by students (profile role, quiz scores,
--     moderation fields) are protected with column privileges, triggers or
--     SECURITY DEFINER functions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Privileges
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;

-- profiles: students may update only these columns (never "role" or "id").
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (
  full_name, university, field_of_study, academic_level, locale, theme,
  timezone, avatar_path, email_notifications, deadline_reminders
) on public.profiles to authenticated;

-- quiz attempts are created and scored through functions only.
revoke insert, update, delete on public.quiz_attempts from authenticated;
revoke insert, update, delete on public.attempt_answers from authenticated;
grant select on public.quiz_attempts, public.attempt_answers to authenticated;

-- notifications are created by the server (service role / triggers);
-- students can only mark them read or delete them.
revoke insert, update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.semesters       enable row level security;
alter table public.courses         enable row level security;
alter table public.materials       enable row level security;
alter table public.tasks           enable row level security;
alter table public.events          enable row level security;
alter table public.quizzes         enable row level security;
alter table public.questions       enable row level security;
alter table public.answers         enable row level security;
alter table public.quiz_attempts   enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.grades          enable row level security;
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.posts           enable row level security;
alter table public.comments        enable row level security;
alter table public.content_reports enable row level security;
alter table public.notifications   enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Owner-only personal tables
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['semesters', 'courses', 'materials', 'tasks', 'events', 'quizzes', 'grades']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || ': read own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || ': insert own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || ': update own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || ': delete own', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- questions & answers — through quiz ownership
-- -----------------------------------------------------------------------------
create or replace function public.owns_quiz(p_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quizzes q
    where q.id = p_quiz_id and q.user_id = (select auth.uid())
  );
$$;

create or replace function public.owns_question(p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions qn
    join public.quizzes q on q.id = qn.quiz_id
    where qn.id = p_question_id and q.user_id = (select auth.uid())
  );
$$;

create policy "questions: read own" on public.questions
  for select to authenticated using (public.owns_quiz(quiz_id));
create policy "questions: insert own" on public.questions
  for insert to authenticated with check (public.owns_quiz(quiz_id));
create policy "questions: update own" on public.questions
  for update to authenticated using (public.owns_quiz(quiz_id)) with check (public.owns_quiz(quiz_id));
create policy "questions: delete own" on public.questions
  for delete to authenticated using (public.owns_quiz(quiz_id));

create policy "answers: read own" on public.answers
  for select to authenticated using (public.owns_question(question_id));
create policy "answers: insert own" on public.answers
  for insert to authenticated with check (public.owns_question(question_id));
create policy "answers: update own" on public.answers
  for update to authenticated using (public.owns_question(question_id)) with check (public.owns_question(question_id));
create policy "answers: delete own" on public.answers
  for delete to authenticated using (public.owns_question(question_id));

-- -----------------------------------------------------------------------------
-- quiz attempts — read own; write through functions
-- -----------------------------------------------------------------------------
create policy "quiz_attempts: read own" on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));

create policy "attempt_answers: read own" on public.attempt_answers
  for select to authenticated
  using (exists (
    select 1 from public.quiz_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  ));

-- Start an attempt; the expiry is computed from the quiz time limit.
create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_quiz public.quizzes;
  v_attempt public.quiz_attempts;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_quiz from public.quizzes where id = p_quiz_id and user_id = v_uid;
  if not found then
    raise exception 'quiz not found' using errcode = 'P0002';
  end if;

  insert into public.quiz_attempts (quiz_id, user_id, expires_at)
  values (
    v_quiz.id,
    v_uid,
    case when v_quiz.time_limit_seconds is null then null
         else now() + make_interval(secs => v_quiz.time_limit_seconds) end
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- Submit an attempt and score it on the server.
-- A question earns its points only when the selected options exactly match
-- the set of correct options (standard multi-answer QCM rule).
-- A 30-second grace period absorbs network latency after the timer ends.
create or replace function public.submit_quiz_attempt(p_attempt_id uuid, p_answer_ids uuid[])
returns public.quiz_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_attempt public.quiz_attempts;
  v_score numeric(7, 2);
  v_max numeric(7, 2);
  v_status public.attempt_status;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.quiz_attempts
  where id = p_attempt_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt already submitted' using errcode = '22023';
  end if;

  v_status := case
    when v_attempt.expires_at is not null and now() > v_attempt.expires_at + interval '30 seconds'
      then 'expired'::public.attempt_status
    else 'submitted'::public.attempt_status
  end;

  -- Store only options that belong to this quiz; late submissions keep no answers.
  if v_status = 'submitted' then
    insert into public.attempt_answers (attempt_id, question_id, answer_id)
    select v_attempt.id, a.question_id, a.id
    from public.answers a
    join public.questions q on q.id = a.question_id
    where q.quiz_id = v_attempt.quiz_id
      and a.id = any (coalesce(p_answer_ids, array[]::uuid[]))
    on conflict do nothing;
  end if;

  select
    coalesce(sum(q.points) filter (where
      not exists (
        -- a correct option that was not selected
        select 1 from public.answers a
        where a.question_id = q.id and a.is_correct
          and not exists (select 1 from public.attempt_answers aa
                          where aa.attempt_id = v_attempt.id and aa.answer_id = a.id)
      )
      and not exists (
        -- an incorrect option that was selected
        select 1 from public.attempt_answers aa
        join public.answers a on a.id = aa.answer_id
        where aa.attempt_id = v_attempt.id and aa.question_id = q.id and not a.is_correct
      )
      and exists (select 1 from public.answers a where a.question_id = q.id and a.is_correct)
    ), 0),
    coalesce(sum(q.points), 0)
  into v_score, v_max
  from public.questions q
  where q.quiz_id = v_attempt.quiz_id;

  update public.quiz_attempts
  set status = v_status,
      submitted_at = now(),
      score = case when v_status = 'expired' then 0 else v_score end,
      max_score = v_max
  where id = v_attempt.id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

revoke all on function public.start_quiz_attempt(uuid) from public;
revoke all on function public.submit_quiz_attempt(uuid, uuid[]) from public;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- Community helpers
-- -----------------------------------------------------------------------------
create or replace function public.group_role_of(p_group_id uuid)
returns public.group_role
language sql
stable
security definer
set search_path = ''
as $$
  select gm.role from public.group_members gm
  where gm.group_id = p_group_id and gm.user_id = (select auth.uid());
$$;

create or replace function public.is_platform_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('moderator', 'admin')
  );
$$;

create or replace function public.can_view_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id
      and (g.visibility = 'public' or public.group_role_of(g.id) is not null)
  );
$$;

create or replace function public.can_moderate_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.group_role_of(p_group_id) in ('owner', 'moderator')
      or public.is_platform_moderator();
$$;

-- -----------------------------------------------------------------------------
-- groups
-- -----------------------------------------------------------------------------
create policy "groups: read visible" on public.groups
  for select to authenticated
  using (visibility = 'public' or public.group_role_of(id) is not null);

create policy "groups: create as self" on public.groups
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "groups: owner updates" on public.groups
  for update to authenticated
  using (public.group_role_of(id) = 'owner')
  with check (public.group_role_of(id) = 'owner');

create policy "groups: owner deletes" on public.groups
  for delete to authenticated
  using (public.group_role_of(id) = 'owner');

-- -----------------------------------------------------------------------------
-- group_members
-- -----------------------------------------------------------------------------
create policy "group_members: read in visible groups" on public.group_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.group_role_of(group_id) is not null);

-- Students can join public groups as plain members.
create policy "group_members: join public group" on public.group_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
    and exists (select 1 from public.groups g where g.id = group_id and g.visibility = 'public')
  );

-- Owners manage roles.
create policy "group_members: owner manages roles" on public.group_members
  for update to authenticated
  using (public.group_role_of(group_id) = 'owner')
  with check (public.group_role_of(group_id) = 'owner');

-- Leave a group, or be removed by a moderator (owners cannot be removed this way).
create policy "group_members: leave or remove" on public.group_members
  for delete to authenticated
  using (
    (user_id = (select auth.uid()) and role <> 'owner')
    or (public.can_moderate_group(group_id) and role <> 'owner')
  );

-- -----------------------------------------------------------------------------
-- posts & comments
-- -----------------------------------------------------------------------------
create policy "posts: read" on public.posts
  for select to authenticated
  using (
    public.can_view_group(group_id)
    and (status = 'visible' or author_id = (select auth.uid()) or public.can_moderate_group(group_id))
  );

create policy "posts: members create" on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'visible'
    and public.group_role_of(group_id) is not null
  );

create policy "posts: author or moderator updates" on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()) or public.can_moderate_group(group_id))
  with check (author_id = (select auth.uid()) or public.can_moderate_group(group_id));

create policy "posts: author or moderator deletes" on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()) or public.can_moderate_group(group_id));

create or replace function public.post_group_id(p_post_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.group_id from public.posts p where p.id = p_post_id;
$$;

create policy "comments: read" on public.comments
  for select to authenticated
  using (
    public.can_view_group(public.post_group_id(post_id))
    and (status = 'visible' or author_id = (select auth.uid())
         or public.can_moderate_group(public.post_group_id(post_id)))
  );

create policy "comments: members create" on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'visible'
    and public.group_role_of(public.post_group_id(post_id)) is not null
  );

create policy "comments: author or moderator updates" on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()) or public.can_moderate_group(public.post_group_id(post_id)))
  with check (author_id = (select auth.uid()) or public.can_moderate_group(public.post_group_id(post_id)));

create policy "comments: author or moderator deletes" on public.comments
  for delete to authenticated
  using (author_id = (select auth.uid()) or public.can_moderate_group(public.post_group_id(post_id)));

-- Only moderators may change moderation fields; authors may only edit the body.
create or replace function public.guard_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group uuid;
begin
  if tg_table_name = 'posts' then
    v_group := new.group_id;
    if new.group_id is distinct from old.group_id then
      raise exception 'cannot move a post to another group' using errcode = '42501';
    end if;
  else
    v_group := public.post_group_id(new.post_id);
    if new.post_id is distinct from old.post_id then
      raise exception 'cannot move a comment' using errcode = '42501';
    end if;
  end if;

  if new.author_id is distinct from old.author_id then
    raise exception 'cannot change author' using errcode = '42501';
  end if;

  if (new.status, new.moderated_by, new.moderated_at)
       is distinct from (old.status, old.moderated_by, old.moderated_at) then
    if auth.uid() is not null and not public.can_moderate_group(v_group) then
      raise exception 'only moderators can change moderation status' using errcode = '42501';
    end if;
    new.moderated_by := auth.uid();
    new.moderated_at := now();
  end if;

  if new.body is distinct from old.body
     and auth.uid() is not null and new.author_id <> auth.uid() then
    raise exception 'only the author can edit the content' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger posts_guard_moderation
  before update on public.posts
  for each row execute function public.guard_moderation_fields();

create trigger comments_guard_moderation
  before update on public.comments
  for each row execute function public.guard_moderation_fields();

-- -----------------------------------------------------------------------------
-- content reports
-- -----------------------------------------------------------------------------
create or replace function public.report_group_id(p_post_id uuid, p_comment_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.group_id from public.posts p where p.id = p_post_id),
    (select p.group_id from public.comments c join public.posts p on p.id = c.post_id where c.id = p_comment_id)
  );
$$;

create policy "content_reports: reporter or moderator reads" on public.content_reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or public.can_moderate_group(public.report_group_id(post_id, comment_id)));

create policy "content_reports: report visible content" on public.content_reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and public.can_view_group(public.report_group_id(post_id, comment_id))
  );

create policy "content_reports: moderator resolves" on public.content_reports
  for update to authenticated
  using (public.can_moderate_group(public.report_group_id(post_id, comment_id)))
  with check (public.can_moderate_group(public.report_group_id(post_id, comment_id)));

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: mark own read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "notifications: delete own" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- Helper functions are callable by signed-in users only.
revoke all on function public.owns_quiz(uuid) from public;
revoke all on function public.owns_question(uuid) from public;
revoke all on function public.group_role_of(uuid) from public;
revoke all on function public.is_platform_moderator() from public;
revoke all on function public.can_view_group(uuid) from public;
revoke all on function public.can_moderate_group(uuid) from public;
revoke all on function public.post_group_id(uuid) from public;
revoke all on function public.report_group_id(uuid, uuid) from public;
grant execute on function
  public.owns_quiz(uuid), public.owns_question(uuid), public.group_role_of(uuid),
  public.is_platform_moderator(), public.can_view_group(uuid), public.can_moderate_group(uuid),
  public.post_group_id(uuid), public.report_group_id(uuid, uuid)
to authenticated;

-- Trigger-only functions must not be callable directly.
revoke all on function public.handle_new_user() from public, authenticated;
revoke all on function public.add_group_owner() from public, authenticated;
revoke all on function public.guard_moderation_fields() from public, authenticated;
