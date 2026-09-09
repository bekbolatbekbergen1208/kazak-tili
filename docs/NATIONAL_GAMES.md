# QazaqDos — Ұлттық ойындар

## Run

Use Node 22, `npm install`, then `npm run dev -- --port 3014`.
Open http://localhost:3014/learn/national?demo=1 for the local demo.
Complete the existing onboarding if prompted. Demo progress belongs to the browser.
For a real account, open `/learn/national?demo=0` and sign in.

## Supabase setup

Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
Add `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) **only to the server environment**.
Apply `supabase/migrations/` in filename order (001 through 007) in the Supabase SQL editor, then restart Next.js.
The new migration is `202609090007_national_games.sql`. No existing progress is rewritten.
The API fails closed without a server writer. Do not restore client write grants to work around a missing server key.

The existing `qd_learning_states` row remains the single atomic source of truth. Read-only `security_invoker` views reuse its owner RLS:

| Model | Storage / view |
| --- | --- |
| Profile | existing `qd_user_profiles` |
| Character catalog, collection | existing `qd_characters`, `qd_user_characters` |
| Character stats | `qd_character_stats` |
| Wallet | `qd_wallet` |
| Inventory, shop items | existing `qd_user_inventory`, `qd_shop_items`; `lib/characters/config.ts` catalog |
| Lesson reward extras | `qd_lesson_rewards`; base XP/coins remain in existing transaction views |
| Reward claims | `qd_reward_claims` |
| Game sessions, results | `qd_game_sessions`, `qd_game_results` |
| Daily streak and game quests | `qd_daily_streak` |
| Achievements | existing `qd_user_achievements` |

Mutations authenticate with Supabase `getUser`, calculate actions in server code, and update using `user_id` + expected `revision`. A concurrent stale action cannot debit or award twice. Browser clients cannot write the aggregate. Asyk sends direction/power, never scores; the server runs the same fixed-step collision simulation. Arqan uses server time and server-known answers. This prevents forged balances and replayed actions, not automated solving of public educational questions.

## Routes

- `/learn/national`: village and onboarding
- `/learn/national/asyk`: five-shot physics game, language bonus, pointer and keyboard controls
- `/learn/national/arqan`: level 2 word/rope game, 15 seconds per answer
- `/learn/national/character`: chosen companion, equipment and stats
- `/learn/national/upgrade`: strength, accuracy and knowledge (five upgrades each)
- `/learn/national/shop`: existing wearables, coin purchases, crystal alternatives for rare skin and celebration
- `/learn/national/rewards`: merged transaction history
- `/learn/national/result`: latest result (`?id=` opens an older one)
- `/learn/national/daily`: game, vocabulary and lesson quests

## Economy and behavior

Existing lesson XP/coin amounts are preserved to avoid breaking the established economy. First completion now additionally grants 1 crystal (2 for tests) and a knowledge bonus. The completion dialog shows the actual balance difference, including streak/level bonuses. Reopening lessons never pays again.

Only the first three completed national games per UTC day award game XP/currency; further games are practice. Wins award 50 coins and 2 crystals; other results award 20 coins. Base XP is 20, plus correct answers × (2 + knowledge), plus 20 on a win. Each daily quest pays 15 XP, 25 coins and 1 crystal once per UTC day. Upgrades cost 3, 6, 9, 12, 15 crystals. No real-money purchases.

Progress saves after each answer and shot. One active national session per user; switching tabs/reloading resumes it. Arqan timers continue while away. Session and reward histories currently live in the aggregate JSON; at larger scale, move old history to a normalized archive through a transaction/RPC while retaining revision checks.

UI text/content is grouped in `lib/national/catalog.ts`; new screens use Kazakh without changing the legacy Russian/English interface. Canvas uses a 600×500 logical surface, fixed 60 Hz simulation and requestAnimationFrame. Reduced motion disables decorative motion; the light-mode switch reduces canvas decoration. Music and sound are opt-in and start after user interaction. Existing vector characters and equipment are reused.

## Files and checks

New code: `lib/national/*`, `components/national/*`, `app/learn/national/*`.
Integration: learning state/types/provider frame/layout, lesson player, `/api/learning`.
Database: migration 007. Tests: `tests/national.test.ts`, `tests/browser/national.spec.ts`, extended `tests/sql.test.ts`.

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
With the app running: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3014 npm run test:e2e -- tests/browser/national.spec.ts`.
The current `lint` script is TypeScript checking, not ESLint.

## Verified in this workspace

`npm test`: 30 passed, including migration execution and RLS isolation.
`npm run lint`, `npm run typecheck`, `npm run build`: passed.
Playwright national + learning suites: 16 passed across desktop and mobile, including actual mouse/touch dragging, lesson reward sequencing, reload persistence, purchases and upgrades.
Local production preview: http://127.0.0.1:3014/learn/national?demo=1.
Live Supabase saving was not exercised: this workspace has no server writer key. Migration 007 is provided, not applied to the hosted project.

### Exact changed/added source files

Added:
- `app/learn/national/page.tsx`
- `app/learn/national/[screen]/page.tsx`
- `app/learn/national/national.css`
- `components/national/games.tsx`
- `components/national/hub.tsx`
- `components/national/shared.tsx`
- `components/national/screens.tsx`
- `components/national/lesson-reward.tsx`
- `components/national/reward-presentation.tsx`
- `lib/national/catalog.ts`
- `lib/national/physics.ts`
- `lib/national/state.ts`
- `lib/national/types.ts`
- `supabase/migrations/202609090007_national_games.sql`
- `tests/national.test.ts`
- `tests/browser/national.spec.ts`
- `docs/NATIONAL_GAMES.md`

Updated:
- `app/api/learning/route.ts`
- `app/learn/layout.tsx`
- `components/learning/frame.tsx`
- `components/learning/lesson-player.tsx`
- `lib/learning/state.ts`
- `lib/learning/types.ts`
- `tests/sql.test.ts`
- `tests/browser/learning.spec.ts`
