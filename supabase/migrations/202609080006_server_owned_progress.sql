-- Apply AFTER configuring SUPABASE_SECRET_KEY on the Next.js server.
-- Users retain read access through owner RLS. All changes go through authenticated
-- /api/learning, which evaluates actions and uses compare-and-swap revisions.
-- Does not delete or rewrite existing user records or public catalogs.
begin;
revoke insert,update,delete on public.qd_learning_states from authenticated;
grant select,insert,update on public.qd_learning_states to service_role;
commit;
