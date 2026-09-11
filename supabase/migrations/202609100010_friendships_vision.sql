begin;
create table if not exists public.qd_friend_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 friend_code text not null unique check(friend_code ~ '^[A-Z0-9]{8}$'),
 username text unique check(username ~ '^[a-z0-9_]{3,24}$'),
 timezone text not null default 'Asia/Almaty' check(length(timezone) between 3 and 64),
 created_at timestamptz not null default now()
);
create table if not exists public.qd_friend_requests(
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.qd_friend_profiles(user_id) on delete cascade,
 receiver_id uuid not null references public.qd_friend_profiles(user_id) on delete cascade,
 status text not null default 'pending' check(status in('pending','accepted','declined')),
 created_at timestamptz not null default now(), responded_at timestamptz,
 check(sender_id<>receiver_id)
);
create unique index if not exists qd_one_pending_request on public.qd_friend_requests(least(sender_id,receiver_id),greatest(sender_id,receiver_id)) where status='pending';
create table if not exists public.qd_friendships(
 user_a uuid not null references public.qd_friend_profiles(user_id) on delete cascade,
 user_b uuid not null references public.qd_friend_profiles(user_id) on delete cascade,
 bond_points integer not null default 0 check(bond_points>=0),
 joined_at timestamptz not null default now(), blocked_by uuid references auth.users(id),
 streak_freeze_week date, primary key(user_a,user_b),check(user_a<user_b)
);
create index if not exists qd_friendships_b on public.qd_friendships(user_b);
create table if not exists public.qd_friend_events(
 id text primary key check(length(id)<=160),user_a uuid not null,user_b uuid not null,
 kind text not null check(length(kind)<=40),points integer not null check(points between 0 and 100),
 created_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb,
 foreign key(user_a,user_b) references public.qd_friendships(user_a,user_b) on delete cascade
);
alter table public.qd_friend_profiles enable row level security;alter table public.qd_friend_requests enable row level security;alter table public.qd_friendships enable row level security;alter table public.qd_friend_events enable row level security;
revoke all on public.qd_friend_profiles,public.qd_friend_requests,public.qd_friendships,public.qd_friend_events from anon,authenticated;
grant select,insert,update,delete on public.qd_friend_profiles,public.qd_friend_requests,public.qd_friendships,public.qd_friend_events to service_role;
commit;
