begin;

create table if not exists public.literary_dna_profiles (
  id text primary key,
  work_title text not null,
  author text not null,
  rights_mode text not null default 'metadata_and_analysis_only'
    check (rights_mode = 'metadata_and_analysis_only'),
  recommended_levels text[] not null default '{}',
  dimensions jsonb not null,
  traits text[] not null default '{}',
  learning_goals text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','approved','rejected')),
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    dimensions ?& array[
      'lexicalRichness','dialogueNaturalness','descriptionDepth',
      'emotionalNuance','sentenceComplexity','figurativeDensity',
      'culturalContext','narrativeDynamics'
    ]
  ),
  check (status <> 'approved' or approved_by is not null)
);

alter table public.literary_dna_profiles enable row level security;

create policy approved_literary_dna
  on public.literary_dna_profiles
  for select to authenticated
  using (status = 'approved' and approved_by is not null);

grant select on public.literary_dna_profiles to authenticated;
revoke insert, update, delete on public.literary_dna_profiles from authenticated, anon;
grant all on public.literary_dna_profiles to service_role;

insert into public.literary_dna_profiles
(id,work_title,author,recommended_levels,dimensions,traits,learning_goals,status,approved_by)
values
(
 'abai-zholy-analysis','Абай жолы','Мұхтар Әуезов',array['B1','B2','C1'],
 '{"lexicalRichness":0.92,"dialogueNaturalness":0.82,"descriptionDepth":0.95,"emotionalNuance":0.84,"sentenceComplexity":0.88,"figurativeDensity":0.72,"culturalContext":0.96,"narrativeDynamics":0.74}'::jsonb,
 array['rich_nature_description','cultural_context','character_detail','complex_narration','subtle_imagery'],
 array['Табиғат пен ортаны нақты деталь арқылы сипаттау','Сөйлем құрылымын түрлендіріп, мағынаны жоғалтпау','Мәдени контексті түсінікті сөзбен жеткізу'],
 'approved','QazaqDos Literary DNA seed v1'
),
(
 'ulpan-analysis','Ұлпан','Ғабит Мүсірепов',array['B1','B2','C1'],
 '{"lexicalRichness":0.82,"dialogueNaturalness":0.91,"descriptionDepth":0.72,"emotionalNuance":0.8,"sentenceComplexity":0.74,"figurativeDensity":0.58,"culturalContext":0.9,"narrativeDynamics":0.78}'::jsonb,
 array['strong_character_voice','concise_dialogue','social_context','traditional_register','leadership_language'],
 array['Қысқа әрі нық диалог құру','Кейіпкер мінезін ісі мен сөзі арқылы көрсету','Құрмет пен жауапкершілікті табиғи тілмен білдіру'],
 'approved','QazaqDos Literary DNA seed v1'
),
(
 'mahabbat-kyzyk-analysis','Махаббат, қызық мол жылдар','Әзілхан Нұршайықов',array['A2','B1','B2'],
 '{"lexicalRichness":0.76,"dialogueNaturalness":0.95,"descriptionDepth":0.64,"emotionalNuance":0.92,"sentenceComplexity":0.65,"figurativeDensity":0.52,"culturalContext":0.72,"narrativeDynamics":0.7}'::jsonb,
 array['emotional_dialogue','relationship_language','soft_narration','natural_conversation','youth_communication'],
 array['Сезімді асыра сілтемей табиғи жеткізу','Жастар арасындағы жылы диалогты қазақша құру','Қарапайым сөйлемді эмоциялық реңкпен байыту'],
 'approved','QazaqDos Literary DNA seed v1'
),
(
 'shakan-sheri-analysis','Шақан-Шері','Мұхтар Мағауин',array['B1','B2','C1'],
 '{"lexicalRichness":0.86,"dialogueNaturalness":0.68,"descriptionDepth":0.87,"emotionalNuance":0.82,"sentenceComplexity":0.79,"figurativeDensity":0.66,"culturalContext":0.76,"narrativeDynamics":0.95}'::jsonb,
 array['dynamic_narration','nature_vocabulary','tension','psychological_description','atmosphere'],
 array['Қимылды динамикалық етістікпен беру','Кеңістік пен атмосфераны қысқа детальмен сезіндіру','Кейіпкердің ішкі күйін әрекет арқылы көрсету'],
 'approved','QazaqDos Literary DNA seed v1'
)
on conflict (id) do update set
  work_title=excluded.work_title,
  author=excluded.author,
  recommended_levels=excluded.recommended_levels,
  dimensions=excluded.dimensions,
  traits=excluded.traits,
  learning_goals=excluded.learning_goals,
  status=excluded.status,
  approved_by=excluded.approved_by,
  updated_at=now();

commit;
