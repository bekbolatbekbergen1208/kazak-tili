begin;
create table if not exists public.qd_dossha_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 2000),
  answer text not null check (char_length(answer) between 1 and 7000),
  rating text check (rating in ('helpful','unhelpful')),
  learner_note text check (learner_note is null or char_length(learner_note) <= 1000),
  status text not null default 'unrated' check (status in ('unrated','rated','review','corrected')),
  teacher_correction text check (teacher_correction is null or char_length(teacher_correction) <= 5000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists qd_dossha_feedback_review on public.qd_dossha_feedback(status,created_at desc);
alter table public.qd_dossha_feedback enable row level security;
revoke all on public.qd_dossha_feedback from anon;
revoke all on public.qd_dossha_feedback from authenticated;
grant all on public.qd_dossha_feedback to service_role;
grant select on public.qd_dossha_feedback to authenticated;
grant update (rating,learner_note,status) on public.qd_dossha_feedback to authenticated;
create policy "own dossha feedback read" on public.qd_dossha_feedback for select to authenticated using ((select auth.uid())=user_id);
create policy "own dossha feedback rate" on public.qd_dossha_feedback for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and status in ('rated','review'));

create table if not exists public.qd_dossha_knowledge (
  id uuid primary key default gen_random_uuid(),
  source_feedback_id uuid unique references public.qd_dossha_feedback(id) on delete set null,
  question text not null check (char_length(question) between 1 and 2000),
  answer text not null check (char_length(answer) between 3 and 5000),
  keywords text[] not null default '{}',
  approved_by uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists qd_dossha_knowledge_active on public.qd_dossha_knowledge(active,created_at desc);
alter table public.qd_dossha_knowledge enable row level security;
revoke all on public.qd_dossha_knowledge from anon, authenticated;
grant all on public.qd_dossha_knowledge to service_role;
commit;
