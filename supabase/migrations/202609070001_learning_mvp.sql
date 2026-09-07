-- QazaqDos MVP. Additive migration; does not modify the older optional schema.sql.
begin;
create table if not exists public.qd_learning_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null,
 revision integer not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint qd_state_shape check (
  jsonb_typeof(state) = 'object' and state ? 'profile' and state ? 'progress'
  and state->'profile'->>'language' in ('ru','en')
  and state->'profile'->>'goal' in ('tourism','work','study','daily','books')
  and (state->'progress'->>'xp')::integer >= 0
  and (state->'progress'->>'coins')::integer >= 0
 )
);
alter table public.qd_learning_states enable row level security;
create policy "Own learning state read" on public.qd_learning_states for select to authenticated using ((select auth.uid())=user_id);
create policy "Own learning state insert" on public.qd_learning_states for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Own learning state update" on public.qd_learning_states for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update on public.qd_learning_states to authenticated;
revoke all on public.qd_learning_states from anon;

create table public.qd_courses(id text primary key, title jsonb not null, description jsonb not null);
create table public.qd_sections(id text primary key, course_id text not null references public.qd_courses on delete cascade, position integer not null, title jsonb not null, unique(course_id,position));
create table public.qd_books(id text primary key, title text not null, author text not null, content jsonb not null);
create table public.qd_book_chapters(id text primary key, book_id text not null references public.qd_books on delete cascade, title jsonb not null, summary jsonb not null);
create table public.qd_lessons(id text primary key, section_id text not null references public.qd_sections on delete cascade, book_id text references public.qd_books, position integer not null, title jsonb not null, kind text not null check(kind in ('lesson','game','review','test')), unique(section_id,position));
create table public.qd_exercises(id text primary key, lesson_id text not null references public.qd_lessons on delete cascade, position integer not null, content jsonb not null, unique(lesson_id,position));
create table public.qd_exercise_options(exercise_id text references public.qd_exercises on delete cascade, id text not null, content jsonb not null, primary key(exercise_id,id));
create table public.qd_book_quizzes(book_id text references public.qd_books on delete cascade, lesson_id text references public.qd_lessons on delete cascade, primary key(book_id,lesson_id));
create table public.qd_book_questions(book_id text references public.qd_books on delete cascade, exercise_id text references public.qd_exercises on delete cascade, primary key(book_id,exercise_id));
create table public.qd_achievements(id text primary key, content jsonb not null);
create table public.qd_daily_quests(id text primary key, content jsonb not null);
create table public.qd_leagues(id text primary key, min_xp integer not null unique check(min_xp>=0));
insert into public.qd_leagues values ('Қола',0),('Күміс',200),('Алтын',500),('Гауһар',1000);
create index qd_sections_course on public.qd_sections(course_id);
create index qd_lessons_section on public.qd_lessons(section_id);
create index qd_lessons_book on public.qd_lessons(book_id);
create index qd_exercises_lesson on public.qd_exercises(lesson_id);
create index qd_chapters_book on public.qd_book_chapters(book_id);
create index qd_book_questions_exercise on public.qd_book_questions(exercise_id);
create index qd_book_quizzes_lesson on public.qd_book_quizzes(lesson_id);

do $$ declare tbl text; begin
 foreach tbl in array array['qd_courses','qd_sections','qd_books','qd_book_chapters','qd_lessons','qd_exercises','qd_exercise_options','qd_book_quizzes','qd_book_questions','qd_achievements','qd_daily_quests','qd_leagues'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('create policy "Read learning content" on public.%I for select to authenticated using (true)',tbl);
  execute format('grant select on public.%I to authenticated',tbl);
  execute format('revoke all on public.%I from anon',tbl);
 end loop;
end $$;

-- Atomic MVP aggregate, exposed as typed read models. security_invoker preserves owner RLS.
create view public.qd_user_profiles with (security_invoker=true) as select user_id,state->'profile' as profile from public.qd_learning_states;
create view public.qd_user_progress with (security_invoker=true) as select user_id,state->'progress' as progress,revision from public.qd_learning_states;
create view public.qd_lesson_progress with (security_invoker=true) as select user_id,e.key as lesson_id,e.value as progress from public.qd_learning_states cross join lateral jsonb_each(state->'progress'->'lessons') e;
create view public.qd_user_mistakes with (security_invoker=true) as select user_id,e.key as exercise_id,e.value as mistake from public.qd_learning_states cross join lateral jsonb_each(state->'progress'->'mistakes') e;
create view public.qd_user_achievements with (security_invoker=true) as select user_id,e.value as achievement from public.qd_learning_states cross join lateral jsonb_array_elements(state->'progress'->'achievements') e;
create view public.qd_user_quest_progress with (security_invoker=true) as select user_id,e.key as day,e.value as progress from public.qd_learning_states cross join lateral jsonb_each(state->'progress'->'quests') e;
create view public.qd_xp_transactions with (security_invoker=true) as select user_id,e.value as transaction from public.qd_learning_states cross join lateral jsonb_array_elements(state->'progress'->'xpTransactions') e;
create view public.qd_coin_transactions with (security_invoker=true) as select user_id,e.value as transaction from public.qd_learning_states cross join lateral jsonb_array_elements(state->'progress'->'coinTransactions') e;
create view public.qd_user_streaks with (security_invoker=true) as select user_id,state->'progress'->'streak' as streak from public.qd_learning_states;
-- No public user ranking in MVP: the UI explicitly labels fictional demonstration participants.
create view public.qd_league_participants with (security_invoker=true) as
 select user_id,state->'profile'->>'nickname' as nickname,coalesce((select sum((e->>'amount')::integer) from jsonb_array_elements(state->'progress'->'xpTransactions') e where (e->>'date')::timestamptz >= date_trunc('week',now() at time zone 'UTC') at time zone 'UTC'),0) as weekly_xp from public.qd_learning_states;
grant select on public.qd_user_profiles,public.qd_user_progress,public.qd_lesson_progress,public.qd_user_mistakes,public.qd_user_achievements,public.qd_user_quest_progress,public.qd_xp_transactions,public.qd_coin_transactions,public.qd_user_streaks,public.qd_league_participants to authenticated;
commit;
