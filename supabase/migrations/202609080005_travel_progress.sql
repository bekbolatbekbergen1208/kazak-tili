-- Additive owner-only travel read model. Existing balances and JSON are unchanged.
begin;
create or replace view public.qd_user_travel_progress with (security_invoker=true) as
 select user_id, e.key as region_id, e.value as progress, revision
 from public.qd_learning_states
 cross join lateral jsonb_each(coalesce(state->'progress'->'travel'->'regions','{}'::jsonb)) e;
grant select on public.qd_user_travel_progress to authenticated;
revoke all on public.qd_user_travel_progress from anon;
commit;
