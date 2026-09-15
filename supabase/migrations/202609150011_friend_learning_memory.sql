begin;
-- Uses the conversation's existing owner-only RLS and account deletion cascade.
alter table public.qd_friend_conversations
  add column if not exists learning_memory jsonb not null default '[]'::jsonb
  check (jsonb_typeof(learning_memory) = 'array'
    and jsonb_array_length(learning_memory) <= 12
    and octet_length(learning_memory::text) <= 24000);
commit;
