begin;
-- Optional, invitation-only reading league. Reading progress itself continues
-- to use qd_learning_states JSONB and needs no schema change.
create table if not exists public.qd_reading_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[a-f0-9]{12}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.qd_reading_friends (
  user_a uuid not null references public.qd_reading_members(user_id) on delete cascade,
  user_b uuid not null references public.qd_reading_members(user_id) on delete cascade,
  primary key (user_a, user_b),
  check (user_a < user_b)
);
create index if not exists qd_reading_friends_user_b on public.qd_reading_friends(user_b);
alter table public.qd_reading_members enable row level security;
alter table public.qd_reading_friends enable row level security;
revoke all on public.qd_reading_members, public.qd_reading_friends from anon, authenticated;
grant select, insert, update, delete on public.qd_reading_members, public.qd_reading_friends to service_role;
-- Only the authenticated Next.js route reads these tables with the server key;
-- it returns opt-in friends' public reading totals, never their state or drafts.
commit;
