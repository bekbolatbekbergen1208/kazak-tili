-- Additive diagnostic infrastructure. Assessment writes are server-owned.
create table if not exists public.q_level_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 overall_level text not null default 'A0' check(overall_level in ('A0','A1','A2','B1','B2','C1')),
 overall_score integer not null default 0 check(overall_score between 0 and 100),
 confidence_score integer not null default 0 check(confidence_score between 0 and 100),
 result jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.q_level_attempts (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 test_type text not null check(test_type in ('quick','full')), started_at timestamptz not null default now(),
 completed_at timestamptz, duration_seconds integer, state jsonb not null, revision integer not null default 0
);
create unique index if not exists q_level_one_active on public.q_level_attempts(user_id) where completed_at is null;
create table if not exists public.q_level_history (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 attempt_id uuid references public.q_level_attempts(id) on delete set null,
 score integer not null check(score between 0 and 100), level text not null, test_date timestamptz not null default now(), result jsonb not null
);
create table if not exists public.q_level_section_results (
 id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.q_level_attempts(id) on delete cascade,
 skill text not null, score integer check(score between 0 and 100), level text not null, questions_correct integer not null default 0, questions_total integer not null default 0,
 unique(attempt_id,skill)
);
create table if not exists public.q_level_answers (
 id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.q_level_attempts(id) on delete cascade,
 question_id text not null, answer text not null, is_correct boolean, response_time numeric not null, unique(attempt_id,question_id)
);
create table if not exists public.q_level_achievements (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 achievement_type text not null, earned_at timestamptz not null default now(), unique(user_id,achievement_type)
);
-- Only explicitly opted-in safe aliases belong in this table. No answers, writing or audio.
create table if not exists public.q_level_leaderboard_snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade, display_name text not null,
 weekly_growth integer not null default 0, monthly_growth integer not null default 0,
 current_score integer not null default 0, level text not null default 'A0', period date not null default current_date,
 visible boolean not null default false
);
create table if not exists public.q_level_groups (
 id uuid primary key default gen_random_uuid(), name text not null, kind text not null check(kind in ('class','school','city','friends')),
 owner_id uuid not null references auth.users(id) on delete cascade
);
create table if not exists public.q_level_group_members (
 group_id uuid references public.q_level_groups(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
 primary key(group_id,user_id)
);
create index if not exists q_level_history_user_date on public.q_level_history(user_id,test_date desc);
DO $$ declare t text; begin
 foreach t in array array['q_level_profiles','q_level_attempts','q_level_history','q_level_achievements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy own_read on public.%I for select to authenticated using (user_id = auth.uid())',t);
 end loop;
END $$;
alter table public.q_level_answers enable row level security;
alter table public.q_level_section_results enable row level security;
create policy own_answers on public.q_level_answers for select to authenticated using (exists(select 1 from public.q_level_attempts a where a.id=attempt_id and a.user_id=auth.uid()));
create policy own_sections on public.q_level_section_results for select to authenticated using (exists(select 1 from public.q_level_attempts a where a.id=attempt_id and a.user_id=auth.uid()));
alter table public.q_level_leaderboard_snapshots enable row level security;
create policy safe_leaderboard on public.q_level_leaderboard_snapshots for select to authenticated using (visible or user_id=auth.uid());
alter table public.q_level_groups enable row level security;
alter table public.q_level_group_members enable row level security;
create policy own_groups on public.q_level_groups for select to authenticated using(owner_id=auth.uid());
create policy own_membership on public.q_level_group_members for select to authenticated using(user_id=auth.uid());
grant select on public.q_level_profiles,public.q_level_attempts,public.q_level_history,public.q_level_achievements,public.q_level_answers,public.q_level_section_results,public.q_level_leaderboard_snapshots,public.q_level_groups,public.q_level_group_members to authenticated;
grant all on public.q_level_profiles,public.q_level_attempts,public.q_level_history,public.q_level_achievements,public.q_level_answers,public.q_level_section_results,public.q_level_leaderboard_snapshots,public.q_level_groups,public.q_level_group_members to service_role;
revoke insert,update,delete on public.q_level_profiles,public.q_level_attempts,public.q_level_history,public.q_level_achievements,public.q_level_answers,public.q_level_section_results,public.q_level_leaderboard_snapshots,public.q_level_groups,public.q_level_group_members from authenticated,anon;
-- One atomic, optimistic update prevents replayed submissions and partial completion.
create or replace function public.q_level_save(p_user uuid,p_state jsonb,p_revision integer,p_result jsonb default null)
returns void language plpgsql security definer set search_path=public as $$
declare a_id uuid := (p_state->>'id')::uuid; entry jsonb; skill_name text; first_reward uuid; begin
 update q_level_attempts set state=p_state,revision=revision+1,
 completed_at=case when (p_state->>'completed')::boolean then now() else null end,
 duration_seconds=extract(epoch from(now()-started_at))::integer
 where id=a_id and user_id=p_user and revision=p_revision and completed_at is null;
 if not found then raise exception 'Attempt conflict'; end if;
 entry=p_state->'answers'->-1;
 if entry is not null then
 insert into q_level_answers(attempt_id,question_id,answer,is_correct,response_time)
 values(a_id,entry->>'questionId',entry->>'value',(entry->>'correct')::boolean,(entry->>'responseTime')::numeric);
 end if;
 if p_result is not null then
 insert into q_level_history(id,user_id,attempt_id,score,level,result)
 values(a_id,p_user,a_id,(p_result->>'score')::integer,p_result->>'level',p_result);
 insert into q_level_profiles(user_id,overall_level,overall_score,confidence_score,result)
 values(p_user,p_result->>'level',(p_result->>'score')::integer,(p_result->>'confidence')::integer,p_result)
 on conflict(user_id) do update set overall_level=excluded.overall_level,overall_score=excluded.overall_score,confidence_score=excluded.confidence_score,result=excluded.result,updated_at=now();
 for skill_name,entry in select key,value from jsonb_each(p_result->'skills') loop
 insert into q_level_section_results(attempt_id,skill,score,level,questions_total,questions_correct)
 values(a_id,skill_name,(entry->>'score')::integer,entry->>'level',(entry->>'count')::integer,
 (select count(*) from q_level_answers where attempt_id=a_id and is_correct and question_id in (select x->>'questionId' from jsonb_array_elements(p_state->'answers') x where x->>'skill'=skill_name)));
 end loop;
 insert into q_level_achievements(user_id,achievement_type) values(p_user,'assessment_'||(p_result->>'type')) on conflict do nothing returning id into first_reward;
 if first_reward is not null and p_result->>'type'='quick' then
 update qd_learning_states set
 state=jsonb_set(jsonb_set(state,'{progress,xp}',to_jsonb(coalesce((state#>>'{progress,xp}')::integer,0)+50)),
 '{progress,xpTransactions}',coalesce(state#>'{progress,xpTransactions}','[]'::jsonb)||jsonb_build_array(jsonb_build_object('id','q-level-first-quick','amount',50,'date',now(),'reason','Q-Level Quick Test'))),
 revision=revision+1,updated_at=now() where user_id=p_user;
 end if;
 if not (p_result->>'pending')::boolean then
 insert into q_level_achievements(user_id,achievement_type) values(p_user,'level_'||(p_result->>'level')) on conflict do nothing;
 end if;
 if (p_result->>'score')::integer-coalesce((p_result->>'previousScore')::integer,(p_result->>'score')::integer)>=10 then
 insert into q_level_achievements(user_id,achievement_type) values(p_user,'growth_10') on conflict do nothing; end if;
 end if;
end $$;
revoke all on function public.q_level_save(uuid,jsonb,integer,jsonb) from public, anon, authenticated;
grant execute on function public.q_level_save(uuid,jsonb,integer,jsonb) to service_role;
-- Compute growth when read, so published snapshots cannot keep stale weekly points.
create or replace function public.q_level_public_leaderboard()
returns table(display_name text,weekly_growth integer,monthly_growth integer,current_score integer,level text)
language sql stable security definer set search_path=public as $$
 select s.display_name,
 greatest(0,p.overall_score-coalesce(
 (select h.score from q_level_history h where h.user_id=s.user_id and h.test_date<now()-interval '7 days' order by h.test_date desc limit 1),
 (select h.score from q_level_history h where h.user_id=s.user_id order by h.test_date asc limit 1),p.overall_score)),
 greatest(0,p.overall_score-coalesce(
 (select h.score from q_level_history h where h.user_id=s.user_id and h.test_date<now()-interval '30 days' order by h.test_date desc limit 1),
 (select h.score from q_level_history h where h.user_id=s.user_id order by h.test_date asc limit 1),p.overall_score)),
 p.overall_score,p.overall_level from q_level_leaderboard_snapshots s join q_level_profiles p using(user_id)
 where s.visible order by 2 desc limit 100
$$;
revoke all on function public.q_level_public_leaderboard() from public,anon;
grant execute on function public.q_level_public_leaderboard() to authenticated,service_role;
create or replace function public.q_level_beginner(p_user uuid,p_result jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into q_level_profiles(user_id,overall_level,overall_score,confidence_score,result)
 values(p_user,'A0',0,0,p_result) on conflict(user_id) do nothing;
 if not found then raise exception 'Profile already assessed'; end if;
 insert into q_level_history(id,user_id,score,level,result)
 values((p_result->>'id')::uuid,p_user,0,'A0',p_result);
end $$;
revoke all on function public.q_level_beginner(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.q_level_beginner(uuid,jsonb) to service_role;
