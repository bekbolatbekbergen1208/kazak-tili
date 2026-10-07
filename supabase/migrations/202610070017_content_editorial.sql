begin;
-- Catalog mirror only: no learner state, XP or historical IDs are changed.
alter table public.qd_lessons add column if not exists content jsonb not null default '{}'::jsonb;
grant select on public.qd_courses,public.qd_sections,public.qd_lessons,public.qd_exercises,public.qd_exercise_options to service_role;
create policy "Published lesson metadata" on public.qd_lessons as restrictive for select to authenticated using(coalesce(content->>'status','published')='published');
create policy "Published lesson tasks" on public.qd_exercises as restrictive for select to authenticated using(exists(select 1 from public.qd_lessons l where l.id=lesson_id));
create policy "Published task options" on public.qd_exercise_options as restrictive for select to authenticated using(exists(select 1 from public.qd_exercises e where e.id=exercise_id));
create or replace function public.qd_import_learning_catalog(p_data jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
 if jsonb_typeof(p_data)<>'object' or jsonb_array_length(coalesce(p_data->'qd_lessons','[]'))>500 then raise exception 'Invalid catalog';end if;
 insert into qd_courses(id,title,description) select id,title,description from jsonb_to_recordset(coalesce(p_data->'qd_courses','[]')) as x(id text,title jsonb,description jsonb) on conflict(id) do update set title=excluded.title,description=excluded.description;
 insert into qd_sections(id,course_id,position,title) select id,course_id,position,title from jsonb_to_recordset(coalesce(p_data->'qd_sections','[]')) as x(id text,course_id text,position integer,title jsonb) on conflict(id) do update set title=excluded.title,position=excluded.position;
 insert into qd_lessons(id,section_id,book_id,position,title,kind,content) select id,section_id,book_id,position,title,kind,coalesce(content,'{}') from jsonb_to_recordset(coalesce(p_data->'qd_lessons','[]')) as x(id text,section_id text,book_id text,position integer,title jsonb,kind text,content jsonb) on conflict(id) do update set title=excluded.title,content=excluded.content,kind=excluded.kind,position=excluded.position;
 insert into qd_exercises(id,lesson_id,position,content) select id,lesson_id,position,content from jsonb_to_recordset(coalesce(p_data->'qd_exercises','[]')) as x(id text,lesson_id text,position integer,content jsonb) on conflict(id) do update set position=excluded.position,content=excluded.content;
 insert into qd_exercise_options(exercise_id,id,content) select exercise_id,id,content from jsonb_to_recordset(coalesce(p_data->'qd_exercise_options','[]')) as x(exercise_id text,id text,content jsonb) on conflict(exercise_id,id) do update set content=excluded.content;
 update qd_lessons set content=jsonb_set(content,'{status}','"archived"') where id in(select jsonb_array_elements_text(coalesce(p_data->'archiveIds','[]')));
end $$;
revoke all on function public.qd_import_learning_catalog(jsonb) from public,anon,authenticated;
grant execute on function public.qd_import_learning_catalog(jsonb) to service_role;
commit;
