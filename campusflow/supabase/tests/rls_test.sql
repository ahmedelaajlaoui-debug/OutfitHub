-- RLS & integrity tests. Run via: npm run db:verify
\set ON_ERROR_STOP 1
insert into auth.users (id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-0000-0000-000000000001','a@test.ma','{"full_name":"  Amina Benali ","university":"FST Settat","academic_level":"licence_3","locale":"ar"}'),
 ('bbbbbbbb-0000-0000-0000-000000000002','youssef@test.ma','{"full_name":"x","academic_level":"hacker","locale":"en"}');
select id, full_name, university, academic_level, locale, role from public.profiles order by full_name;

create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'PASS (blocked) %: %', label, sqlerrm; return; end;
  raise exception 'FAIL: % was allowed', label;
end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'PASS %', label; else raise exception 'FAIL: %', label; end if; end $$;

-- ===== user A
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.expect((select count(*) from profiles) = 1, 'A sees only own profile');
select pg_temp.expect_fail($$update profiles set role='admin' where id=auth.uid()$$, 'A escalates role');
update profiles set full_name='Amina B.' where id = auth.uid();
insert into semesters (id,user_id,name,academic_year,is_current) values ('5e000000-0000-0000-0000-000000000001',auth.uid(),'S5','2026-2027',true);
insert into courses (id,user_id,semester_id,name,coefficient) values ('c0000000-0000-0000-0000-000000000001',auth.uid(),'5e000000-0000-0000-0000-000000000001','Algorithmique',2);
insert into tasks (user_id,course_id,title,status) values (auth.uid(),'c0000000-0000-0000-0000-000000000001','TP1','done');
select pg_temp.expect((select completed_at is not null from tasks limit 1), 'completed_at auto-set');
update tasks set status='todo';
select pg_temp.expect((select completed_at is null from tasks limit 1), 'completed_at cleared');
insert into grades (user_id,course_id,label,score,weight) values (auth.uid(),'c0000000-0000-0000-0000-000000000001','Examen',15.5,2);
select pg_temp.expect_fail($$insert into grades (user_id,course_id,label,score) values (auth.uid(),'c0000000-0000-0000-0000-000000000001','bad',21)$$, 'grade above max');
select pg_temp.expect_fail($$insert into courses (user_id,name) values ('bbbbbbbb-0000-0000-0000-000000000002','Spoof')$$, 'A inserts course for B');
-- quiz
insert into quizzes (id,user_id,course_id,title,time_limit_seconds) values ('90000000-0000-0000-0000-000000000001',auth.uid(),'c0000000-0000-0000-0000-000000000001','QCM Algo',600);
insert into questions (id,quiz_id,position,prompt,points) values
 ('91000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',0,'Complexité du tri fusion ?',2),
 ('91000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000001',1,'Structures LIFO ?',1);
insert into answers (id,question_id,position,label,is_correct) values
 ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',0,'O(n log n)',true),
 ('92000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000001',1,'O(n²)',false),
 ('92000000-0000-0000-0000-000000000003','91000000-0000-0000-0000-000000000002',0,'Pile',true),
 ('92000000-0000-0000-0000-000000000004','91000000-0000-0000-0000-000000000002',1,'File',false);
select pg_temp.expect_fail($$insert into quiz_attempts (quiz_id,user_id) values ('90000000-0000-0000-0000-000000000001',auth.uid())$$, 'direct attempt insert');
create temp table t_attempt as select * from start_quiz_attempt('90000000-0000-0000-0000-000000000001');
select pg_temp.expect((select expires_at is not null from t_attempt), 'attempt has expiry');
-- Q1 correct, Q2 wrong (selected both) => 2/3
create temp table t_res as select * from submit_quiz_attempt((select id from t_attempt), array['92000000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000003','92000000-0000-0000-0000-000000000004']::uuid[]);
select pg_temp.expect((select score = 2 and max_score = 3 and status='submitted' from t_res), 'score 2/3');
select pg_temp.expect_fail($$select submit_quiz_attempt((select id from t_attempt), '{}')$$, 'double submit');
-- storage
select pg_temp.expect_fail($$insert into storage.objects (bucket_id,name) values ('materials','bbbbbbbb-0000-0000-0000-000000000002/x.pdf')$$, 'upload into another user folder');
insert into storage.objects (bucket_id,name) values ('materials','aaaaaaaa-0000-0000-0000-000000000001/x.pdf');
-- community
insert into groups (id,name,created_by) values ('60000000-0000-0000-0000-000000000001','SMI Settat',auth.uid());
select pg_temp.expect((select role='owner' from group_members where group_id='60000000-0000-0000-0000-000000000001'), 'creator is owner');
select pg_temp.expect_fail($$insert into notifications (user_id,title) values (auth.uid(),'x')$$, 'student creates notification');
commit;

-- ===== user B
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select pg_temp.expect((select count(*) from courses)=0 and (select count(*) from grades)=0 and (select count(*) from quizzes)=0 and (select count(*) from questions)=0 and (select count(*) from answers)=0 and (select count(*) from quiz_attempts)=0 and (select count(*) from storage.objects)=0, 'B sees none of A data');
select pg_temp.expect((select count(*) from profiles)=1, 'B sees only own profile');
select pg_temp.expect_fail($$insert into tasks (user_id,course_id,title) values (auth.uid(),'c0000000-0000-0000-0000-000000000001','steal')$$, 'B task on A course (composite FK)');
select pg_temp.expect_fail($$select start_quiz_attempt('90000000-0000-0000-0000-000000000001')$$, 'B starts A quiz');
update courses set name='hacked'; -- silently affects 0 rows
select pg_temp.expect_fail($$insert into group_members (group_id,user_id,role) values ('60000000-0000-0000-0000-000000000001',auth.uid(),'owner')$$, 'B joins as owner');
insert into group_members (group_id,user_id) values ('60000000-0000-0000-0000-000000000001',auth.uid());
insert into posts (id,group_id,author_id,body) values ('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',auth.uid(),'Qui a le cours d''analyse ?');
insert into comments (post_id,author_id,body) values ('70000000-0000-0000-0000-000000000001',auth.uid(),'Moi');
select pg_temp.expect_fail($$update posts set status='hidden' where id='70000000-0000-0000-0000-000000000001'$$, 'author self-moderates');
commit;

-- ===== A moderates
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.expect((select name='Algorithmique' from courses), 'A course untouched by B');
update posts set status='hidden' where id='70000000-0000-0000-0000-000000000001';
select pg_temp.expect((select moderated_by = auth.uid() from posts where id='70000000-0000-0000-0000-000000000001'), 'owner hid post');
select pg_temp.expect_fail($$update posts set body='edited by mod' where id='70000000-0000-0000-0000-000000000001'$$, 'moderator edits author body');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select pg_temp.expect_fail($$update posts set status='visible' where id='70000000-0000-0000-0000-000000000001'$$, 'author un-hides');
commit;

-- ===== anon
begin;
set local role anon;
select pg_temp.expect_fail($$select * from profiles$$, 'anon reads profiles');
select pg_temp.expect_fail($$select * from groups$$, 'anon reads groups');
commit;
\echo ALL_RLS_TESTS_PASSED
