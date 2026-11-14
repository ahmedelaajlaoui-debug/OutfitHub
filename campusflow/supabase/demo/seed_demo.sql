-- =============================================================================
-- CampusFlow — OPTIONAL DEMO DATA (development / demos only)
--
-- Not a migration and not run automatically. It fills the workspace of ONE
-- existing account so the dashboard can be explored before the Phase 2 modules
-- (courses, tasks, calendar, grades) have their own screens.
--
-- Usage:
--   1. Register in the app with the e-mail below (or change v_email).
--   2. Run this file in the Supabase SQL editor (runs as postgres).
-- It refuses to run if that account already has courses, so it never mixes
-- with real data. Remove the demo data with the DELETE block at the bottom.
-- =============================================================================
do $$
declare
  v_email text := 'demo@campusflow.ma';
  v_uid uuid;
  v_sem uuid;
  v_algo uuid; v_bdd uuid; v_res uuid; v_ana uuid;
  v_today timestamptz := date_trunc('day', now() at time zone 'Africa/Casablanca') at time zone 'Africa/Casablanca';
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise exception 'No account with e-mail %. Register it in the app first.', v_email;
  end if;
  if exists (select 1 from public.courses where user_id = v_uid) then
    raise exception 'Account % already has courses; demo seed skipped.', v_email;
  end if;

  update public.profiles
  set university = 'Faculté des Sciences et Techniques', field_of_study = 'SMI', academic_level = 'licence_3'
  where id = v_uid;

  insert into public.semesters (user_id, name, academic_year, is_current)
  values (v_uid, 'S5', '2026-2027', true) returning id into v_sem;

  insert into public.courses (user_id, semester_id, name, code, instructor, coefficient, color)
  values (v_uid, v_sem, 'Algorithmique avancée', 'M31', 'Pr. Benali', 2, '#4F46E5') returning id into v_algo;
  insert into public.courses (user_id, semester_id, name, code, instructor, coefficient, color)
  values (v_uid, v_sem, 'Bases de données', 'M32', 'Pr. Idrissi', 1.5, '#059669') returning id into v_bdd;
  insert into public.courses (user_id, semester_id, name, code, instructor, coefficient, color)
  values (v_uid, v_sem, 'Réseaux informatiques', 'M33', 'Pr. Alaoui', 1, '#D97706') returning id into v_res;
  insert into public.courses (user_id, semester_id, name, code, instructor, coefficient, color)
  values (v_uid, v_sem, 'Analyse numérique', 'M34', 'Pr. Tazi', 1.5, '#0EA5E9') returning id into v_ana;

  insert into public.tasks (user_id, course_id, title, due_at, priority, status) values
    (v_uid, v_res, 'Rendu TP Réseaux — sous-réseaux', now() + interval '1 day', 'high', 'todo'),
    (v_uid, v_bdd, 'Modèle entité-association du projet', now() + interval '4 days', 'medium', 'in_progress'),
    (v_uid, v_algo, 'Série d''exercices n°3', now() - interval '1 day', 'medium', 'todo'),
    (v_uid, v_ana, 'Réviser la méthode de Newton', now() + interval '6 days', 'low', 'todo'),
    (v_uid, v_algo, 'Lire le chapitre sur les graphes', now() - interval '3 days', 'low', 'done');

  insert into public.events (user_id, course_id, title, type, location, starts_at, ends_at) values
    (v_uid, v_algo, 'Cours magistral', 'class', 'Amphi B', v_today + interval '8 hours 30 minutes', v_today + interval '10 hours'),
    (v_uid, v_bdd, 'TP SQL', 'class', 'Salle TP 3', v_today + interval '10 hours 30 minutes', v_today + interval '12 hours 30 minutes'),
    (v_uid, v_res, 'Contrôle continu', 'exam', 'Salle 12', v_today + interval '15 hours', v_today + interval '16 hours 30 minutes');

  insert into public.grades (user_id, course_id, label, assessment_type, score, max_score, weight, graded_on) values
    (v_uid, v_algo, 'Contrôle continu', 'continuous', 14, 20, 1, current_date - 20),
    (v_uid, v_algo, 'TP noté', 'practical', 31, 40, 1, current_date - 10),
    (v_uid, v_bdd, 'Projet', 'project', 16.5, 20, 2, current_date - 15),
    (v_uid, v_res, 'Contrôle continu', 'continuous', 8.5, 20, 1, current_date - 12),
    (v_uid, v_ana, 'Interrogation', 'continuous', 12, 20, 1, current_date - 5);

  raise notice 'Demo data created for %', v_email;
end;
$$;

-- To remove the demo data for that account (keeps the account and profile):
-- delete from public.courses   where user_id = (select id from auth.users where email = 'demo@campusflow.ma');
-- delete from public.tasks     where user_id = (select id from auth.users where email = 'demo@campusflow.ma');
-- delete from public.semesters where user_id = (select id from auth.users where email = 'demo@campusflow.ma');
