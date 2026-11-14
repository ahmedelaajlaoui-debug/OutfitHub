# CampusFlow

Espace de travail universitaire (cours, échéances, examens, notes, documents PDF, assistant d'étude) pour les étudiants au Maroc — interface en **français** et en **arabe (RTL)**, thème clair/sombre.

> **Status: Phase 1 (foundation).** Landing page, authentication, protected dashboard shell, settings, i18n and the complete database schema are in place. Courses, tasks, calendar, materials, exams, grades, AI assistant and community screens come in later phases (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). In the sidebar they are shown as « Bientôt » and are not clickable.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage) via `@supabase/ssr` · React Hook Form + Zod · Lucide · Vitest + Testing Library. Recharts and PDF.js will be added with the modules that use them.

## 1. Requirements

- Node.js ≥ 20.9 (tested with 22) and npm
- A Supabase project (free tier works)

## 2. Local setup

```bash
cd campusflow
npm install
cp .env.example .env.local     # then fill in the values (section 3)
npm run dev                    # http://localhost:3000 → redirects to /fr or /ar
```

Without Supabase variables the public pages still work, and the login/register forms show a "not configured" notice with submission disabled.

## 3. Supabase configuration

1. **Create a project** at supabase.com.
2. **Environment variables** — *Project Settings → API*:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key (`sb_publishable_…`) or the legacy `anon` key
   - `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000` locally, your domain in production

   Never put the secret / `service_role` key in a `NEXT_PUBLIC_` variable. Phase 1 does not use it at all.
3. **Apply the migrations** (in filename order) from `supabase/migrations/`:
   - Supabase CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`
   - or paste each file into *SQL Editor* and run them in order.
   They create enums, tables, indexes, triggers, RLS policies, quiz RPCs and the private storage buckets.
4. **Auth settings** — *Authentication → URL Configuration*:
   - Site URL: your `NEXT_PUBLIC_SITE_URL`
   - Redirect URLs: add `http://localhost:3000/auth/confirm` and `https://<your-domain>/auth/confirm`
5. **Email confirmation** (recommended: keep "Confirm email" enabled). The default template works (PKCE `?code=` link, same browser). For confirmation from another device, change *Authentication → Email Templates → Confirm signup* link to:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/fr/dashboard
   ```
   Supabase's built-in mailer is rate-limited; configure custom SMTP for production.
6. **Optional demo data** — register `demo@campusflow.ma` in the app, then run `supabase/demo/seed_demo.sql` in the SQL editor. It refuses to run if the account already has courses. Demo data is never applied by migrations.

If the app is connected but migrations are missing, the dashboard shows "database not initialised" instead of crashing.

## 4. Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm test` | Vitest unit & component tests |
| `npm run check` | typecheck + lint + tests |
| `npm run db:verify` | Applies migrations to a throw-away DB on a **local PostgreSQL 15+** (Supabase auth/storage stubbed) and runs the RLS test suite. Uses `PGHOST`/`PGUSER`/… |

## 5. Deployment (Vercel)

1. Import the repository, set **Root Directory** to `campusflow`.
2. Add the environment variables from `.env.example` (production values).
3. Deploy, then add `https://<domain>/auth/confirm` to Supabase redirect URLs and set the Site URL.

Any Node.js host works too: `npm run build && npm start`.

## 6. Security notes

- RLS is enabled on every table; `anon` has no table privileges. Students only see their own personal data; community content is scoped to group membership.
- Cross-owner references are blocked by composite foreign keys (a task cannot point to someone else's course).
- Students cannot change their `role`, write quiz scores, create notifications, or change moderation status (column privileges, `SECURITY DEFINER` RPCs, triggers).
- Storage buckets are private and scoped to `<user_id>/` folders.
- Post-login redirects (`?next=`) are validated against open redirects; registration does not reveal whether an e-mail is already registered.
- Security headers: `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restrictive permissions policy.

## 7. Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the architecture, folder structure, database schema and milestones.
