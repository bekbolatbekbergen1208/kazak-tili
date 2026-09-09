-- Additive projections over the existing atomic aggregate; no duplicate wallets.
-- Apply 001–006 first and configure SUPABASE_SECRET_KEY on the Next.js server.
begin;
revoke insert, update, delete on public.qd_learning_states from authenticated, anon;
grant select, insert, update on public.qd_learning_states to service_role;
create or replace view public.qd_wallet with (security_invoker=true) as
 select user_id, coalesce((state->'progress'->>'coins')::integer,0) coins,
 coalesce((state->'progress'->'national'->>'crystals')::integer,0) crystals,
 coalesce((state->'progress'->>'xp')::integer,0) xp, revision from public.qd_learning_states;
create or replace view public.qd_character_stats with (security_invoker=true) as
 select user_id, e.key character_id, e.value stats, revision from public.qd_learning_states
 cross join lateral jsonb_each(coalesce(state->'progress'->'national'->'stats','{}'::jsonb)) e;
create or replace view public.qd_game_sessions with (security_invoker=true) as
 select user_id, state->'progress'->'national'->'session' session, revision
 from public.qd_learning_states where state->'progress'->'national'->'session' is not null;
create or replace view public.qd_game_results with (security_invoker=true) as
 select user_id, e.value->>'id' id, e.value result from public.qd_learning_states
 cross join lateral jsonb_array_elements(coalesce(state->'progress'->'national'->'results','[]'::jsonb)) e;
create or replace view public.qd_reward_claims with (security_invoker=true) as
 select user_id, e.value->>'id' id, e.value reward from public.qd_learning_states
 cross join lateral jsonb_array_elements(coalesce(state->'progress'->'national'->'rewards','[]'::jsonb)) e;
create or replace view public.qd_daily_streak with (security_invoker=true) as
 select user_id, state->'progress'->'streak' streak,
 coalesce(state->'progress'->'national'->'daily','{}'::jsonb) daily from public.qd_learning_states;
grant select on public.qd_wallet,public.qd_character_stats,public.qd_game_sessions,public.qd_game_results,public.qd_reward_claims,public.qd_daily_streak to authenticated;
revoke all on public.qd_wallet,public.qd_character_stats,public.qd_game_sessions,public.qd_game_results,public.qd_reward_claims,public.qd_daily_streak from anon;
create or replace view public.qd_lesson_rewards with (security_invoker=true) as
 select user_id, e.value reward from public.qd_learning_states
 cross join lateral jsonb_array_elements(coalesce(state->'progress'->'national'->'rewards','[]'::jsonb)) e
 where e.value->>'id' like 'lesson-crystals-%';
grant select on public.qd_lesson_rewards to authenticated;
revoke all on public.qd_lesson_rewards from anon;
commit;
