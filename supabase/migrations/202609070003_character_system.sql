-- Additive companion catalog. Existing learning aggregates and balances are preserved.
begin;
create table public.qd_characters (
 id text primary key, name text not null, animal_type jsonb not null,
 primary_color text not null, secondary_color text not null,
 unlock_xp integer not null check(unlock_xp>=0), rarity text not null check(rarity in ('common','special','rare','legendary')),
 image_url text not null, is_legendary boolean not null default false, content jsonb not null
);
create table public.qd_character_unlock_requirements(character_id text primary key references public.qd_characters on delete cascade,xp integer not null check(xp>=0));
create table public.qd_character_animations(character_id text references public.qd_characters on delete cascade,mood text not null,content jsonb not null,primary key(character_id,mood));
create table public.qd_shop_items(id text primary key,price integer not null check(price>=0),slot text,rarity text not null check(rarity in ('common','special','rare','legendary')),content jsonb not null);
create table public.qd_character_skins(item_id text primary key references public.qd_shop_items on delete cascade,content jsonb not null);
create table public.qd_character_accessories(item_id text primary key references public.qd_shop_items on delete cascade,content jsonb not null);
create index qd_character_unlock_xp on public.qd_characters(unlock_xp);
create index qd_shop_slot on public.qd_shop_items(slot);
do $$ declare tbl text; begin
 foreach tbl in array array['qd_characters','qd_character_unlock_requirements','qd_character_animations','qd_shop_items','qd_character_skins','qd_character_accessories'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('create policy "Read companion catalog" on public.%I for select to authenticated using (true)',tbl);
  execute format('grant select on public.%I to authenticated',tbl);
  execute format('revoke all on public.%I from anon',tbl);
 end loop;
end $$;
-- Personal state remains a single CAS-protected aggregate (qd_learning_states).
create view public.qd_user_characters with(security_invoker=true) as
 select s.user_id,c.id as character_id,c.unlock_xp,coalesce(s.state->'progress'->'characters'->>'selectedId','tilmash')=c.id as is_selected
 from public.qd_learning_states s join public.qd_characters c on (s.state->'progress'->>'xp')::integer>=c.unlock_xp;
create view public.qd_user_inventory with(security_invoker=true) as
 select s.user_id,i.item_id from public.qd_learning_states s cross join lateral jsonb_array_elements_text(s.state->'progress'->'inventory') i(item_id);
create view public.qd_user_equipped_items with(security_invoker=true) as
 select s.user_id,c.key as character_id,e.key as slot,e.value as item_id from public.qd_learning_states s
 cross join lateral jsonb_each(coalesce(s.state->'progress'->'characters'->'equipped','{}')) c
 cross join lateral jsonb_each_text(c.value) e
 union all
 select s.user_id,'global' as character_id,e.key as slot,e.value as item_id from public.qd_learning_states s
 cross join lateral jsonb_each_text(coalesce(s.state->'progress'->'characters'->'globalEquipped','{}')) e;
grant select on public.qd_user_characters,public.qd_user_inventory,public.qd_user_equipped_items to authenticated;
revoke all on public.qd_user_characters,public.qd_user_inventory,public.qd_user_equipped_items from anon;
commit;
