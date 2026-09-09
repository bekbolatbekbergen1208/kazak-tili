begin;
create table if not exists public.qd_friend_conversations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages)='array' and jsonb_array_length(messages)<=20 and octet_length(messages::text)<=120000),
  updated_at timestamptz not null default now()
);
alter table public.qd_friend_conversations enable row level security;
revoke all on public.qd_friend_conversations from anon;
grant select, insert, update, delete on public.qd_friend_conversations to authenticated;
create policy "read own friend chat" on public.qd_friend_conversations for select to authenticated using (auth.uid()=user_id);
create policy "insert own friend chat" on public.qd_friend_conversations for insert to authenticated with check (auth.uid()=user_id);
create policy "update own friend chat" on public.qd_friend_conversations for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "delete own friend chat" on public.qd_friend_conversations for delete to authenticated using (auth.uid()=user_id);
commit;
