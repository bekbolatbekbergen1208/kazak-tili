begin;
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
set local search_path=public,extensions;
create table if not exists public.kazakh_embeddings (
 chunk_id uuid primary key references public.kazakh_corpus_chunks(id) on delete cascade,
 embedding vector(768) not null,model text not null,created_at timestamptz not null default now()
);
create index if not exists kazakh_embeddings_cosine on public.kazakh_embeddings using hnsw(embedding vector_cosine_ops);
alter table public.kazakh_embeddings enable row level security;
revoke all on public.kazakh_embeddings from authenticated,anon;
grant all on public.kazakh_embeddings to service_role;
create or replace function public.match_kazakh_chunks(query_embedding vector(768),query_model text,allowed_levels text[],school_only boolean default true,match_count integer default 6)
returns table(id text,title text,text text,level text,style text,author text,copyright_status text,source_type text,score float)
language sql stable security definer set search_path=public,extensions as $$
 select c.id,c.title,ch.text,c.level,c.style,c.author,c.copyright_status,c.source_type,(1-(e.embedding<=>query_embedding))::float
 from kazakh_embeddings e join kazakh_corpus_chunks ch on ch.id=e.chunk_id join kazakh_corpus c on c.id=ch.corpus_id
 where c.status='approved' and c.approved_by is not null and c.level=any(allowed_levels)
 and c.quality_score>=70 and c.language_quality>=70 and c.educational_value>=60 and c.age_suitability>=70
 and c.revision=ch.revision and e.model=query_model and (not school_only or c.age_group<>'adult')
 order by e.embedding<=>query_embedding limit least(greatest(match_count,1),8)
$$;
revoke all on function public.match_kazakh_chunks(vector,text,text[],boolean,integer) from public,authenticated,anon;
grant execute on function public.match_kazakh_chunks(vector,text,text[],boolean,integer) to service_role;
create or replace function public.kazakh_rebuild_embeddings(p_source text,p_revision integer,p_chunks jsonb,p_model text)
returns void language plpgsql security definer set search_path=public,extensions as $$
declare entry jsonb;cid uuid;begin
 perform 1 from kazakh_corpus where id=p_source and revision=p_revision and status='approved' and approved_by is not null for update;
 if not found then raise exception 'Source conflict or unapproved';end if;
 if jsonb_array_length(p_chunks)>100 then raise exception 'Too many chunks';end if;
 delete from kazakh_corpus_chunks where corpus_id=p_source;
 for entry in select value from jsonb_array_elements(p_chunks) loop
 cid=(entry->>'id')::uuid;
 insert into kazakh_corpus_chunks(id,corpus_id,text,position,revision) values(cid,p_source,entry->>'text',(entry->>'position')::integer,p_revision);
 insert into kazakh_embeddings(chunk_id,embedding,model) values(cid,(entry->>'embedding')::vector(768),p_model);
 end loop;
end $$;
revoke all on function public.kazakh_rebuild_embeddings(text,integer,jsonb,text) from public,authenticated,anon;
grant execute on function public.kazakh_rebuild_embeddings(text,integer,jsonb,text) to service_role;
commit;
