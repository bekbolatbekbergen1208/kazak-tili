begin;
create table if not exists public.kazakh_corpus (
 id text primary key, title text not null, source_type text not null check(source_type in ('educational','dictionary','literature','teacher')),
 author text not null, copyright_status text not null check(copyright_status in ('public_domain','licensed','teacher_created','open_license','short_approved_excerpt')),
 license text not null check(length(license)>0), rights_evidence text not null check(length(rights_evidence)>=15),
 level text not null check(level in ('A0','A1','A2','B1','B2','C1')),genre text not null,style text not null,topic text not null,region text not null,
 age_group text not null check(age_group in ('all','school','adult')),text text not null check(length(text) between 20 and 20000),keywords text[] not null default '{}',
 approved_by text,status text not null default 'draft' check(status in ('draft','approved','rejected')),created_at timestamptz not null default now(),
 quality_score integer not null check(quality_score between 0 and 100),language_quality integer not null check(language_quality between 0 and 100),
 educational_value integer not null check(educational_value between 0 and 100),age_suitability integer not null check(age_suitability between 0 and 100),revision integer not null default 1,
 check(status<>'approved' or (approved_by is not null and quality_score>=70 and language_quality>=70 and educational_value>=60 and age_suitability>=70)),
 check(copyright_status<>'short_approved_excerpt' or length(text)<=1200)
);
create table if not exists public.kazakh_corpus_chunks (
 id uuid primary key default gen_random_uuid(),corpus_id text not null references public.kazakh_corpus(id) on delete cascade,
 text text not null check(length(text) between 1 and 1000),position integer not null,revision integer not null,unique(corpus_id,position)
);
create table if not exists public.kazakh_style_rules (
 id text primary key,style text not null,level text not null,text text not null,approved boolean not null default false
);
create table if not exists public.kazakh_phrase_bank (
 id text primary key,phrase text not null,meaning text not null,example text not null,level text not null,
 corpus_id text references public.kazakh_corpus(id) on delete cascade,approved boolean not null default false
);
create table if not exists public.qd_language_states (
 user_id uuid primary key references auth.users(id) on delete cascade,state jsonb not null,
 revision integer not null default 1,updated_at timestamptz not null default now(),check(state->>'version'='1')
);
create table if not exists public.kazakh_corpus_audit (
 id uuid primary key default gen_random_uuid(),source_id text,actor_id uuid references auth.users(id) on delete set null,
 action text not null,created_at timestamptz not null default now()
);
alter table public.kazakh_corpus enable row level security;
alter table public.kazakh_corpus_chunks enable row level security;
alter table public.kazakh_style_rules enable row level security;
alter table public.kazakh_phrase_bank enable row level security;
alter table public.qd_language_states enable row level security;
alter table public.kazakh_corpus_audit enable row level security;
create policy approved_corpus on public.kazakh_corpus for select to authenticated using(status='approved' and approved_by is not null and age_group<>'adult');
create policy approved_chunks on public.kazakh_corpus_chunks for select to authenticated using(exists(select 1 from public.kazakh_corpus c where c.id=corpus_id and c.status='approved' and c.approved_by is not null and c.revision=kazakh_corpus_chunks.revision and c.age_group<>'adult'));
create policy approved_styles on public.kazakh_style_rules for select to authenticated using(approved);
create policy approved_phrases on public.kazakh_phrase_bank for select to authenticated using(approved);
create policy own_language_state on public.qd_language_states for select to authenticated using(user_id=auth.uid());
grant select on public.kazakh_corpus,public.kazakh_corpus_chunks,public.kazakh_style_rules,public.kazakh_phrase_bank,public.qd_language_states to authenticated;
revoke all on public.kazakh_corpus_audit from authenticated,anon;
revoke insert,update,delete on public.kazakh_corpus,public.kazakh_corpus_chunks,public.kazakh_style_rules,public.kazakh_phrase_bank,public.qd_language_states from authenticated,anon;
grant all on public.kazakh_corpus,public.kazakh_corpus_chunks,public.kazakh_style_rules,public.kazakh_phrase_bank,public.qd_language_states,public.kazakh_corpus_audit to service_role;
create or replace function public.qd_language_save(p_user uuid,p_state jsonb,p_revision integer,p_xp integer default 0)
returns integer language plpgsql security definer set search_path=public as $$
declare next_revision integer;begin
 if p_xp not between 0 and 20 then raise exception 'Invalid reward';end if;
 if p_revision=0 then
 insert into qd_language_states(user_id,state,revision) values(p_user,p_state,1) on conflict do nothing returning revision into next_revision;
 else
 update qd_language_states set state=p_state,revision=revision+1,updated_at=now() where user_id=p_user and revision=p_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'State conflict';end if;
 if p_xp>0 then
 update qd_learning_states set state=jsonb_set(jsonb_set(state,'{progress,xp}',to_jsonb(coalesce((state#>>'{progress,xp}')::integer,0)+p_xp)),
 '{progress,xpTransactions}',coalesce(state#>'{progress,xpTransactions}','[]'::jsonb)||jsonb_build_array(jsonb_build_object('id','literary-'||gen_random_uuid()::text,'amount',p_xp,'date',now(),'reason','Әдебиет арқылы қазақ тілі'))),revision=revision+1,updated_at=now() where user_id=p_user;
 end if;return next_revision;
end $$;
revoke all on function public.qd_language_save(uuid,jsonb,integer,integer) from public,authenticated,anon;
grant execute on function public.qd_language_save(uuid,jsonb,integer,integer) to service_role;
-- Approval/edit/retirement invalidates all old chunks in the same transaction.
create or replace function public.kazakh_source_save(p_item jsonb,p_expected integer,p_actor uuid,p_action text)
returns integer language plpgsql security definer set search_path=public as $$
declare item kazakh_corpus; next_revision integer;begin
 if p_action='delete' then
 delete from kazakh_corpus where id=p_item->>'id' and revision=p_expected;
 if not found then raise exception 'Source conflict';end if;
 insert into kazakh_corpus_audit(source_id,actor_id,action) values(p_item->>'id',p_actor,p_action);return 0;
 end if;
 select * into item from jsonb_populate_record(null::kazakh_corpus,p_item);
 if p_expected=0 then
 insert into kazakh_corpus select (item).* returning revision into next_revision;
 else
 update kazakh_corpus set title=item.title,source_type=item.source_type,author=item.author,copyright_status=item.copyright_status,license=item.license,rights_evidence=item.rights_evidence,
 level=item.level,genre=item.genre,style=item.style,topic=item.topic,region=item.region,age_group=item.age_group,text=item.text,keywords=item.keywords,approved_by=item.approved_by,status=item.status,
 quality_score=item.quality_score,language_quality=item.language_quality,educational_value=item.educational_value,age_suitability=item.age_suitability,revision=revision+1
 where id=item.id and revision=p_expected returning revision into next_revision;
 if next_revision is null then raise exception 'Source conflict';end if;
 end if;
 delete from kazakh_corpus_chunks where corpus_id=item.id;
 insert into kazakh_corpus_audit(source_id,actor_id,action) values(item.id,p_actor,p_action);
 return next_revision;
end $$;
revoke all on function public.kazakh_source_save(jsonb,integer,uuid,text) from public,authenticated,anon;
grant execute on function public.kazakh_source_save(jsonb,integer,uuid,text) to service_role;
commit;
