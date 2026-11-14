# CampusFlow — Architecture

## 1. Overview

```
Browser ──► Next.js 16 (App Router, Vercel/Node)
             │  proxy.ts        locale routing + Supabase session refresh + route guard
             │  Server Components / Server Actions  (Zod validation, Data Access Layer)
             │  Route Handler   /auth/confirm  (email confirmation)
             ▼
         Supabase
             ├─ Auth      email + password, cookie sessions (@supabase/ssr)
             ├─ Postgres  normalized schema, RLS on every table, SECURITY DEFINER RPCs
             └─ Storage   private buckets "materials" (PDF) and "avatars"
         AI provider (Phase 4) — called only from the server, key in server env
```

Key decisions

| Decision | Reason |
| --- | --- |
| **Supabase SQL migrations, no Prisma** | RLS policies, storage policies, triggers and `SECURITY DEFINER` functions are first-class in SQL. Prisma Migrate would compete for ownership of the schema and cannot express RLS; the Supabase client already gives typed queries that run *as the user*, so RLS applies. One schema tool, no drift. |
| **Publishable key only in the app** | All data access goes through the user's JWT + RLS. No service-role/secret key is used anywhere in Phase 1. |
| **Cache Components (Next 16 default)** | Public pages are fully static; app pages prerender a static shell (sidebar, header) and stream user data behind `<Suspense>` with skeletons. |
| **Locale in the URL (`/fr`, `/ar`)** | Shareable, cacheable, SEO-friendly. `proxy.ts` negotiates from cookie → `Accept-Language` → `fr`. `<html lang dir>` is set per locale, layout uses logical CSS properties (`ms-`, `pe-`, `start-`, `border-e`) so Arabic mirrors correctly. |
| **Typed dictionaries (TS objects)** | `ar` must satisfy `typeof fr`, so a missing key is a compile error; a test also checks placeholders. |
| **Validation messages are dictionary keys** | The same Zod schema runs in React Hook Form and in the Server Action; the UI translates the key. |
| **Integrity in the database** | Composite foreign keys `(course_id, user_id) → courses(id, user_id)` make it impossible to attach a task/grade/material to another student's course, independently of RLS. |

Security layers for a protected page

1. `proxy.ts` refreshes the session (`getClaims()` validates the JWT) and redirects anonymous users to `/{locale}/login?next=…`.
2. The page calls `requireUser()` (Data Access Layer) on the server — the proxy is never the only check.
3. Every query runs with the user's JWT, so Postgres RLS filters rows.
4. Column privileges / triggers / RPCs protect fields students must never set (profile `role`, quiz scores, moderation status).

## 2. Folder structure

```
campusflow/
├─ docs/ARCHITECTURE.md
├─ supabase/
│  ├─ migrations/            schema, RLS + RPCs, storage buckets (apply in order)
│  ├─ demo/seed_demo.sql     optional demo data, never run automatically
│  └─ tests/                 plain-Postgres verification (stubs + RLS tests)
├─ src/
│  ├─ proxy.ts               locale routing, session refresh, route guard
│  ├─ app/
│  │  ├─ globals.css         design tokens (light/dark), Tailwind v4 theme
│  │  ├─ auth/confirm/       email confirmation route handler
│  │  └─ [locale]/           root layout (html lang/dir, providers)
│  │     ├─ page.tsx         landing page
│  │     ├─ (auth)/          login, register (split layout)
│  │     └─ (app)/           protected shell: dashboard, settings (+ future modules)
│  ├─ components/
│  │  ├─ ui/                 Button, Input/Select, FormField, Card, Badge, Alert, Skeleton, EmptyState…
│  │  ├─ layout/             sidebar, mobile drawer, user menu, locale switcher, theme toggle…
│  │  └─ landing/            landing sections
│  ├─ features/              feature modules: schemas, server actions, queries, UI
│  │  ├─ auth/  dashboard/  settings/
│  ├─ config/navigation.ts   sidebar items and their availability
│  ├─ lib/
│  │  ├─ i18n/               config, dictionaries (fr, ar), provider, formatting
│  │  ├─ supabase/           env, server client, proxy session helper
│  │  ├─ auth/session.ts     Data Access Layer (getCurrentUser / requireUser)
│  │  ├─ academic/           grade math (/20, coefficients), time-zone helpers
│  │  └─ routes.ts           localized paths, protected paths, safe redirects
│  └─ types/database.ts      typed schema for supabase-js
└─ .env.example
```

New modules follow the same pattern: `src/features/<module>/` (schemas, actions, queries, components) + `src/app/[locale]/(app)/<module>/page.tsx`, then flip the item to `available` in `config/navigation.ts` and add the path to `PROTECTED_PATHS`.

## 3. Database schema

All tables: `uuid` primary keys (`gen_random_uuid()`), `created_at` / `updated_at` (trigger-maintained), CHECK constraints for lengths/ranges, indexes on every foreign key and main query path, RLS enabled.

| Table | Purpose | Key columns / rules |
| --- | --- | --- |
| `profiles` | 1:1 with `auth.users`, created by trigger from signup metadata (sanitised) | `full_name`, `university`, `field_of_study`, `academic_level` enum, `locale` (fr/ar), `theme`, `timezone` (default Africa/Casablanca), `role` (student/moderator/admin — not updatable by students) |
| `semesters` | Academic periods | `name`, `academic_year` (`2026-2027`), one `is_current` per user |
| `courses` | Modules | `semester_id` (same owner), `coefficient` (0–20], `credits`, `color` hex, `archived_at` |
| `materials` | PDF metadata | `storage_path` must start with `<user_id>/`, `mime_type = application/pdf`, ≤ 50 MB |
| `tasks` | To-dos with deadlines | `priority` low/medium/high, `status` todo/in_progress/done, `completed_at` kept in sync by trigger |
| `events` | Calendar | `type` class/exam/deadline/study/other, `ends_at ≥ starts_at` |
| `quizzes` | QCM | optional `course_id` / `material_id` (same owner), `time_limit_seconds`, `source` manual/ai |
| `questions` | Quiz questions | `position` (unique per quiz), `points`, `explanation` |
| `answers` | Answer options | `is_correct` (several correct options allowed) |
| `quiz_attempts` | Timed attempts | written only by `start_quiz_attempt()` / `submit_quiz_attempt()`; server-side expiry + scoring (all-or-nothing per question) |
| `attempt_answers` | Selected options | used for scoring and answer review |
| `grades` | Assessments | `score ≤ max_score` (default /20), `weight` inside the course |
| `groups`, `group_members` | Community | public/private; creator becomes `owner` by trigger; roles owner/moderator/member |
| `posts`, `comments` | Community content | `status` visible/hidden/removed; only moderators change status (trigger), only authors edit the body |
| `content_reports` | Moderation queue | exactly one target (post or comment) |
| `notifications` | In-app notifications | created by the server only; students can mark read/delete; `link` must be an internal path |

Averages: course average = weighted mean of assessments normalised to /20; overall = mean of course averages weighted by course coefficient (`src/lib/academic/grades.ts`, unit-tested).

Storage: buckets `materials` (PDF, 50 MB) and `avatars` (PNG/JPEG/WebP, 2 MB) are **private**; object keys are `<auth.uid()>/…` and policies only allow the owner. Files will be served with short-lived signed URLs created on the server.

## 4. Milestones

| Phase | Scope | Status |
| --- | --- | --- |
| **1 — Foundation** | Project setup, design system, landing, registration/login/logout, email confirmation route, protected shell, responsive navigation (sidebar + drawer), FR/AR + RTL, dark mode, dashboard (real queries), settings (profile, language, theme), full schema + RLS + storage, tests | **Done (this delivery)** |
| 2 — Academic core | Semesters & courses CRUD (search, filters), tasks CRUD, calendar month/week views, grades entry + Recharts progress charts | Next |
| 3 — Materials & exams | PDF upload/organisation, PDF.js viewer, signed-URL downloads; quiz builder, timed attempts via RPCs, results & answer review | Planned |
| 4 — AI Study Assistant | Server-only provider adapter, PDF text extraction + chunking, grounded explanations/summaries/quiz generation, "not configured" state without key, rate limiting & usage logging | Planned |
| 5 — Community & notifications | Groups, posts, comments, reports/moderation UI, safe public-profile view, notifications (deadline reminders), notification settings | Planned |
| 6 — Hardening | E2E tests (Playwright) against a Supabase test project, accessibility audit, CSP, observability, performance | Planned |
