-- Optional production schema. Demo mode does not require Supabase.
create table users (id uuid primary key, role text not null check (role in ('student','teacher','admin')), created_at timestamptz default now());
create table student_profiles (user_id uuid primary key references users on delete cascade, anonymous_code text unique not null, nickname text not null, avatar text, consent_recorded boolean default false);
create table teachers (user_id uuid primary key references users on delete cascade, display_name text);
create table research_projects (id uuid primary key default gen_random_uuid(), teacher_id uuid references teachers(user_id), title text not null, starts_on date, ends_on date, is_demo boolean default false);
create table research_groups (id uuid primary key default gen_random_uuid(), project_id uuid references research_projects on delete cascade, kind text check (kind in ('control','experimental')), leaderboard_enabled boolean default true);
create table group_members (group_id uuid references research_groups on delete cascade, student_id uuid references student_profiles(user_id) on delete cascade, primary key(group_id,student_id));
create table lesson_topics (id uuid primary key default gen_random_uuid(), slug text unique, title_kk text, title_ru text);
create table lessons (id uuid primary key default gen_random_uuid(), topic_id uuid references lesson_topics, title text, difficulty int default 1);
create table vocabulary (id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons, word_kk text, translation_ru text);
create table questions (id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons, kind text, prompt jsonb, answer jsonb);
create table attempts (id uuid primary key default gen_random_uuid(), student_id uuid references student_profiles(user_id), question_id uuid references questions, correct boolean, duration_ms int, hints_used int default 0, created_at timestamptz default now());
create table learning_events (id bigint generated always as identity primary key, student_id uuid references student_profiles(user_id), event_type text, payload jsonb, created_at timestamptz default now());
create table student_interests (student_id uuid references student_profiles(user_id), topic_id uuid references lesson_topics, visits int default 0, primary key(student_id,topic_id));
create table recommendations (id uuid primary key default gen_random_uuid(), student_id uuid references student_profiles(user_id), reason text, payload jsonb, completed boolean default false);
create table pre_tests (student_id uuid references student_profiles(user_id), project_id uuid references research_projects, score numeric, primary key(student_id,project_id));
create table post_tests (student_id uuid references student_profiles(user_id), project_id uuid references research_projects, score numeric, primary key(student_id,project_id));
create table motivation_surveys (student_id uuid references student_profiles(user_id), project_id uuid references research_projects, answers int[], primary key(student_id,project_id));
create table achievements (id uuid primary key default gen_random_uuid(), slug text unique, title text, description text);
create table leaderboard_scores (student_id uuid references student_profiles(user_id), group_id uuid references research_groups, score int default 0, updated_at timestamptz default now(), primary key(student_id,group_id));

