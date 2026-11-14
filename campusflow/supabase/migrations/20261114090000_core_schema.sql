-- =============================================================================
-- CampusFlow — core schema
-- Tables, enums, constraints, indexes and triggers.
-- Row Level Security lives in 20261114090100_rls_policies.sql
-- Storage buckets live in 20261114090200_storage.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.app_locale as enum ('fr', 'ar');
create type public.theme_preference as enum ('light', 'dark', 'system');
create type public.user_role as enum ('student', 'moderator', 'admin');
create type public.academic_level as enum (
  'licence_1', 'licence_2', 'licence_3',
  'master_1', 'master_2',
  'prepa_1', 'prepa_2',
  'ingenieur_1', 'ingenieur_2', 'ingenieur_3',
  'doctorat', 'other'
);
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.event_type as enum ('class', 'exam', 'deadline', 'study', 'other');
create type public.quiz_source as enum ('manual', 'ai');
create type public.attempt_status as enum ('in_progress', 'submitted', 'expired');
create type public.assessment_type as enum ('exam', 'continuous', 'practical', 'project', 'other');
create type public.group_visibility as enum ('public', 'private');
create type public.group_role as enum ('owner', 'moderator', 'member');
create type public.content_status as enum ('visible', 'hidden', 'removed');
create type public.report_status as enum ('open', 'reviewed', 'dismissed');
create type public.notification_type as enum ('deadline', 'exam', 'community', 'system');

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user, created by trigger on signup
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  full_name           text not null check (char_length(btrim(full_name)) between 2 and 120),
  university          text check (char_length(university) <= 160),
  field_of_study      text check (char_length(field_of_study) <= 120),
  academic_level      public.academic_level,
  locale              public.app_locale not null default 'fr',
  theme               public.theme_preference not null default 'system',
  timezone            text not null default 'Africa/Casablanca' check (char_length(timezone) <= 64),
  role                public.user_role not null default 'student',
  avatar_path         text check (char_length(avatar_path) <= 512),
  email_notifications boolean not null default true,
  deadline_reminders  boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile from signup metadata. Metadata is user-controlled,
-- so every value is trimmed, length-limited and validated here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := left(btrim(coalesce(meta ->> 'full_name', '')), 120);
  v_locale text := meta ->> 'locale';
  v_level text := meta ->> 'academic_level';
begin
  if char_length(v_name) < 2 then
    v_name := left(split_part(coalesce(new.email, 'Étudiant'), '@', 1), 120);
    if char_length(v_name) < 2 then
      v_name := 'Étudiant';
    end if;
  end if;

  insert into public.profiles (id, full_name, university, field_of_study, academic_level, locale)
  values (
    new.id,
    v_name,
    nullif(left(btrim(coalesce(meta ->> 'university', '')), 160), ''),
    nullif(left(btrim(coalesce(meta ->> 'field_of_study', '')), 120), ''),
    case
      when v_level = any (enum_range(null::public.academic_level)::text[])
        then v_level::public.academic_level
      else null
    end,
    case when v_locale in ('fr', 'ar') then v_locale::public.app_locale else 'fr' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- semesters
-- -----------------------------------------------------------------------------
create table public.semesters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 80),
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  starts_on     date,
  ends_on       date,
  is_current    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint semesters_dates_check check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint semesters_unique_name unique (user_id, academic_year, name),
  -- target for composite foreign keys that guarantee same-owner references
  constraint semesters_id_user_unique unique (id, user_id)
);

create index semesters_user_idx on public.semesters (user_id, academic_year desc);
create unique index semesters_one_current_idx on public.semesters (user_id) where is_current;

create trigger semesters_set_updated_at
  before update on public.semesters
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- courses
-- -----------------------------------------------------------------------------
create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  semester_id uuid,
  name        text not null check (char_length(btrim(name)) between 2 and 120),
  code        text check (char_length(code) <= 20),
  instructor  text check (char_length(instructor) <= 120),
  coefficient numeric(4, 2) not null default 1 check (coefficient > 0 and coefficient <= 20),
  credits     smallint check (credits between 0 and 60),
  color       text not null default '#4F46E5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text check (char_length(description) <= 2000),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint courses_id_user_unique unique (id, user_id),
  constraint courses_semester_fk foreign key (semester_id, user_id)
    references public.semesters (id, user_id) on delete set null (semester_id)
);

create index courses_user_idx on public.courses (user_id, created_at desc);
create index courses_semester_idx on public.courses (semester_id) where semester_id is not null;

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- materials — PDF metadata. Bytes live in the private "materials" bucket at
-- <user_id>/<material_id>.pdf
-- -----------------------------------------------------------------------------
create table public.materials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  course_id    uuid,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text check (char_length(description) <= 2000),
  storage_path text not null unique check (char_length(storage_path) <= 512),
  file_name    text not null check (char_length(file_name) between 1 and 255),
  mime_type    text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  size_bytes   bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  page_count   integer check (page_count > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint materials_path_owner_check check (split_part(storage_path, '/', 1) = user_id::text),
  constraint materials_id_user_unique unique (id, user_id),
  constraint materials_course_fk foreign key (course_id, user_id)
    references public.courses (id, user_id) on delete set null (course_id)
);

create index materials_user_idx on public.materials (user_id, created_at desc);
create index materials_course_idx on public.materials (course_id) where course_id is not null;

create trigger materials_set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  course_id    uuid,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text check (char_length(description) <= 5000),
  due_at       timestamptz,
  priority     public.task_priority not null default 'medium',
  status       public.task_status not null default 'todo',
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tasks_completion_check check ((status = 'done') = (completed_at is not null)),
  constraint tasks_course_fk foreign key (course_id, user_id)
    references public.courses (id, user_id) on delete set null (course_id)
);

create index tasks_user_status_due_idx on public.tasks (user_id, status, due_at);
create index tasks_course_idx on public.tasks (course_id) where course_id is not null;

-- Keep completed_at consistent with status.
create or replace function public.sync_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completion
  before insert or update of status, completed_at on public.tasks
  for each row execute function public.sync_task_completion();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- events (calendar)
-- -----------------------------------------------------------------------------
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_id   uuid,
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (char_length(description) <= 2000),
  type        public.event_type not null default 'other',
  location    text check (char_length(location) <= 200),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint events_time_check check (ends_at >= starts_at),
  constraint events_course_fk foreign key (course_id, user_id)
    references public.courses (id, user_id) on delete cascade
);

create index events_user_starts_idx on public.events (user_id, starts_at);
create index events_course_idx on public.events (course_id) where course_id is not null;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- quizzes / questions / answers (answer options)
-- -----------------------------------------------------------------------------
create table public.quizzes (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  course_id          uuid,
  material_id        uuid,
  title              text not null check (char_length(btrim(title)) between 2 and 200),
  description        text check (char_length(description) <= 2000),
  time_limit_seconds integer check (time_limit_seconds between 30 and 14400),
  source             public.quiz_source not null default 'manual',
  shuffle_questions  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint quizzes_course_fk foreign key (course_id, user_id)
    references public.courses (id, user_id) on delete set null (course_id),
  constraint quizzes_material_fk foreign key (material_id, user_id)
    references public.materials (id, user_id) on delete set null (material_id)
);

create index quizzes_user_idx on public.quizzes (user_id, created_at desc);
create index quizzes_course_idx on public.quizzes (course_id) where course_id is not null;
create index quizzes_material_idx on public.quizzes (material_id) where material_id is not null;

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes (id) on delete cascade,
  position    integer not null check (position >= 0),
  prompt      text not null check (char_length(btrim(prompt)) between 1 and 2000),
  explanation text check (char_length(explanation) <= 4000),
  points      numeric(5, 2) not null default 1 check (points > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint questions_position_unique unique (quiz_id, position) deferrable initially deferred
);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position    integer not null check (position >= 0),
  label       text not null check (char_length(btrim(label)) between 1 and 1000),
  is_correct  boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint answers_position_unique unique (question_id, position) deferrable initially deferred
);

-- -----------------------------------------------------------------------------
-- quiz attempts — written only through the start/submit functions below so
-- that timing and scoring are computed on the server.
-- -----------------------------------------------------------------------------
create table public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  status       public.attempt_status not null default 'in_progress',
  started_at   timestamptz not null default now(),
  expires_at   timestamptz,
  submitted_at timestamptz,
  score        numeric(7, 2),
  max_score    numeric(7, 2),
  constraint quiz_attempts_submission_check check (
    (status = 'in_progress' and submitted_at is null and score is null)
    or (status <> 'in_progress' and submitted_at is not null and score is not null and max_score is not null)
  ),
  constraint quiz_attempts_expiry_check check (expires_at is null or expires_at > started_at)
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id, started_at desc);
create index quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id);

-- Selected options for an attempt; used for automatic scoring and answer review.
create table public.attempt_answers (
  attempt_id  uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_id   uuid not null references public.answers (id) on delete cascade,
  primary key (attempt_id, answer_id)
);

create index attempt_answers_question_idx on public.attempt_answers (attempt_id, question_id);

-- -----------------------------------------------------------------------------
-- grades — Moroccan /20 scale by default
-- -----------------------------------------------------------------------------
create table public.grades (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  course_id       uuid not null,
  label           text not null check (char_length(btrim(label)) between 1 and 120),
  assessment_type public.assessment_type not null default 'exam',
  score           numeric(6, 2) not null check (score >= 0),
  max_score       numeric(6, 2) not null default 20 check (max_score > 0),
  weight          numeric(5, 2) not null default 1 check (weight > 0 and weight <= 100),
  graded_on       date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint grades_score_range_check check (score <= max_score),
  constraint grades_course_fk foreign key (course_id, user_id)
    references public.courses (id, user_id) on delete cascade
);

create index grades_user_idx on public.grades (user_id, graded_on desc);
create index grades_course_idx on public.grades (course_id);

create trigger grades_set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- community: groups, members, posts, comments, reports
-- -----------------------------------------------------------------------------
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 3 and 80),
  description text check (char_length(description) <= 1000),
  visibility  public.group_visibility not null default 'public',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index groups_visibility_idx on public.groups (visibility, created_at desc);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create table public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- The creator of a group becomes its owner.
create or replace function public.add_group_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.group_members (group_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (group_id, user_id) do update set role = 'owner';
  end if;
  return new;
end;
$$;

create trigger groups_add_owner
  after insert on public.groups
  for each row execute function public.add_group_owner();

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(btrim(body)) between 1 and 10000),
  status       public.content_status not null default 'visible',
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index posts_group_created_idx on public.posts (group_id, created_at desc);
create index posts_author_idx on public.posts (author_id);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(btrim(body)) between 1 and 4000),
  status       public.content_status not null default 'visible',
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index comments_post_created_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create table public.content_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id     uuid references public.posts (id) on delete cascade,
  comment_id  uuid references public.comments (id) on delete cascade,
  reason      text not null check (char_length(btrim(reason)) between 3 and 500),
  status      public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint content_reports_target_check check (num_nonnulls(post_id, comment_id) = 1)
);

create index content_reports_status_idx on public.content_reports (status, created_at desc);
create index content_reports_post_idx on public.content_reports (post_id) where post_id is not null;
create index content_reports_comment_idx on public.content_reports (comment_id) where comment_id is not null;

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null default 'system',
  title      text not null check (char_length(btrim(title)) between 1 and 200),
  body       text check (char_length(body) <= 1000),
  -- internal, relative links only (prevents open redirects from notifications)
  link       text check (link ~ '^/[^/]' and char_length(link) <= 500),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_user_idx on public.notifications (user_id, created_at desc);
