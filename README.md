# QazaqDos MVP

Новый личный кабинет: `/learn`. Регистрация: `/login`. Пять целей, русский/английский язык объяснений, 45 уроков, 225 заданий, прогресс и награды. Старые исследовательские демо-страницы сохранены.

**[Функции, запуск, миграции Supabase, тесты и границы MVP](docs/LEARNING-MVP.md)**.

**[Жануар-кейіпкерлер: 8 дос, XP арқылы ашу, скиндер және дүкен](docs/CHARACTERS.md)**. Коллекция: `/learn/characters`, заттар: `/learn/inventory`. Қосымша Supabase миграциялары: `003_character_system` және `004_character_catalog`.

Для облачного кабинета сначала примените две миграции из `supabase/migrations/`. Без миграций доступен локальный демо-режим `/learn?demo=1`.

Балаларға қазақ тілін ойын және қауіпсіз виртуалды AI-дос арқылы үйрететін demo-first веб-платформа. Supabase клиенттері мен сессияны жаңарту middleware-і қосылған. Интерфейс қазақ тілінде және телефонға бейімделген.

## Іске қосу

`.env.example` файлын `.env.local` ретінде көшіріп, Supabase жобаңыздың URL және publishable key мәндерін енгізіңіз. `.env.local` Git-ке жіберілмейді.

```bash
npm install
npm run dev
```

`http://localhost:3000` мекенжайын ашыңыз. Тексеру: `npm run typecheck` және `npm run build`.

## Supabase

Браузерде `@/utils/supabase/client`, ал Server Component немесе Route Handler ішінде `@/utils/supabase/server` клиентін қолданыңыз. Түбірдегі `middleware.ts` сессия cookie-лерін жаңартады.

Server Component мысалы (Supabase ішінде `todos` кестесі және тиісті оқу рұқсаттары болса):

```tsx
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = createClient(await cookies());
  const { data: todos, error } = await supabase.from("todos").select("id, name");
  if (error) throw new Error("Could not load todos");
  return <ul>{todos?.map((todo) => <li key={todo.id}>{todo.name}</li>)}</ul>;
}
```

Жаңа `/learn` кабинеті Supabase Auth пен жеке прогресті қолданады; алдымен миграцияларды орындаңыз. Бұрынғы `/student` зерттеу демосы және жаңа кабинеттің demo режимі браузерде сақталады.

## Демо кіру

- Оқушы: `/login` → «Оқушы» (Айбын, эксперимент тобы)
- Мұғалім/зерттеуші: `/login` → «Мұғалім / зерттеуші»
- Құпиясөз қажет емес. Барлық 12 қатысушы — ойдан шығарылған никнеймдер мен анонимді кодтар.

## Беттер мен функциялар

- `/` — жоба презентациясы
- `/student` — деңгей, ұпай, серия, саяхат картасы және шағын рейтинг
- `/student/control` — бақылау тобының бейтарап, ойынсыз интерфейсі
- `/student/assessment` — A1 қалыптастырушы диагностикасы және 6 құзырет картасы
- `/student/journey` — Қазақстан → Әуежай → Ұшақ → Астана бағыты
- `/student/lesson/travel` — 6 сөз, 6 құзыреттік тапсырма, түсіндірме және меңгеруге дейінгі қате қайталау
- `/student/friend` — оқу тақырыбымен шектелген mock AI диалогы
- `/leaderboard` — тек никнеймдерден тұратын рейтинг
- `/teacher`, `/teacher/analytics` — топтарды салыстыру, графиктер және нәтижелер
- `/teacher/research` — екі топ пен зерттеу хаттамасы
- `/teacher/students` — сүзгіленетін анонимді қатысушылар
- `/about-research` — әдістеме, формулалар, сауалнама және этика
- `/methodology` — 2023–2029 тіл саясаты тұжырымдамасына негізделген A1–C1 оқу моделі
- `/api/ai-friend` — кейін нақты LLM провайдеріне ауыстырылатын mock endpoint
- `/api/adaptive` — дәлдік пен қайталанған қателерге негізделген ережелер

Оқушының сабақ күйі мен қиын сөздері браузердің `localStorage` қоймасында сақталады. CSV экспорты жеке деректерсіз жасалады. Dashboard-тағы барлық нәтижелер экранда «ДЕМО ДЕРЕКТЕР» деп белгіленген және ғылыми қорытынды болып саналмайды.

Сабақтағы барлық негізгі сұрақ аяқталған соң қате сұрақтар жеке кезекке жиналады. Қайталанған айналымда сұрақтардың реті де, жауап нұсқаларының орны да араласады. Қате қалған жағдайда цикл қайта құрылады; сабақ тек барлық тапсырма меңгерілгенде аяқталады.

## Өндіріске шығару алдында

`supabase/schema.sql` ұсынылған деректер құрылымын қамтиды. Өндірісте Supabase Auth, Row Level Security, мұғалімнің рейтингті өшіруі, келісімді тіркеу/қайтарып алу, қатысушыны толық жою, серверлік оқиға журналын және нақты тест/сауалнама редакторын қосу қажет. Нағыз LLM қосылса, жүйелік қауіпсіздік саясаты, контент сүзгісі, лимит және аудит міндетті.

Досша маскоты built-in image generation көмегімен осы жобаға арнайы жасалды. Финал prompt: original sky-blue steppe spirit, modern cream chapan with Kazakh ornamental trim, orange travel scarf, compass, friendly 3D educational-game style, no text or known mascot resemblance.

«Қазақстанға саяхат»: `/kazakhstan` — карта, өңірлер, сөздік пен ойындар.
Контенттің дайындық күйі және Supabase баптауы: [docs/TRAVEL.md](docs/TRAVEL.md).
