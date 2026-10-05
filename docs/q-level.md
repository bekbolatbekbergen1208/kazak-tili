# QazaqDos Q-Level

Q-Level is an internal, provisional diagnostic estimate, not certification. Existing lessons, auth, learning state, XP and routes remain in place.

## Run and deploy

1. Apply `supabase/migrations/202610050013_q_level.sql` after the existing learning-state migrations, through the Supabase SQL editor or your migration pipeline.
2. Configure existing public Supabase variables and `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` on the server. Never put the server key in a public variable.
3. Run `npm run dev`. Open `/learn/q-level`. New onboarding now leads to `/learn/q-level/quick`; tourists can continue to the existing map.
4. For an account-free local preview, use `/learn/q-level?demo=1` and complete onboarding. Demo test history stays in this browser and is never submitted to the real leaderboard.

The migration has been executed in PGlite tests, not against a remote production project. No deployment or GitHub push has been performed.

## Implemented behavior

- 16-question adaptive Quick Test and 22-task Full Test across five sections.
- 40 original Kazakh editorial seed questions, A1–C1, separate from pages. Server-only answer checking and randomized options/question selection; recent question IDs are avoided when possible.
- Difficulty changes use a rolling three-answer model. A single mistake does not immediately lower ability. Overall classification has a weakest-measured-skill cap. Scores and confidence reflect measured evidence; writing/speaking remain unassessed.
- Quick and full attempts save after each answer. Account attempts use Supabase, optimistic revisions and an atomic completion function. Demo attempts use isolated browser storage. Completed attempts and private answers are protected by owner RLS.
- Full retests have a server-enforced seven-day cooldown. Quick Checks are available in between. A suggestion appears after 25 completed lessons.
- Results, radar chart, weakest-skill recommendations, progress history, Qazaq Passport and 1080×1080 PNG export/native sharing.
- Dashboard, profile, sidebar and homepage integrations. Doszhan receives the authenticated user's diagnostic profile as additional context when its existing live AI mode is enabled.
- The first authenticated Quick Test grants 50 XP atomically and only once. Assessment/full and improvement badges are stored separately. XP never raises Q-Level.
- Leaderboards require explicit opt-in and expose only a nickname, score, level and improvement. Growth is computed from history at read time rather than retaining stale weekly snapshots. Friends require consent infrastructure; school Cup content is labelled demo.
- Activity-based league estimate and private teacher/group infrastructure.

## Audio and evaluation limits

Seed listening tasks currently use a Kazakh system voice through browser speech synthesis. The transcript is not displayed before answering. If a Kazakh voice is unavailable, the learner can skip; missing evidence lowers confidence rather than becoming an incorrect answer. A real recorded audio URL can be added to each question's `audio_url`. Speech text delivered for synthesis is technically accessible through network inspection; recorded audio and a larger calibrated bank are necessary for higher-stakes testing.

Microphone recording works locally with a timer and playback. Voice is not uploaded; it is lost when leaving the page. Learners may supply a transcript, but no writing/speaking score is fabricated. `lib/q-level/evaluation.ts` defines the provider/rubric boundary and currently returns `pending`. A reviewed evaluation provider, private audio storage, transcription and a server-owned result-revision workflow must be connected before these skills receive scores.

## Remaining product work

The seed bank and scoring estimates need expert validation and empirical calibration. It is not yet a large, standardized exam bank. The reusable renderer and grading engine support single/multiple choice, matching, ordering, fill-blank, short-answer, audio, writing and speaking. The editorial seed pool currently uses choice, contextual fill-blank, audio and production tasks. Further content must be authored and reviewed for the remaining formats. Weekly league promotion/relegation jobs, real school competitions and consent-based friend comparison remain future functionality. Lesson recommendations link to existing practice routes rather than rewriting or unlocking the established curriculum.

## Verification

`npm run typecheck`, `npm run build`, unit/adaptive tests, transactional SQL/RLS tests and desktop/mobile Playwright tests. The unrelated existing friendships migration is blank in this checkout and causes the old SQL suite to fail with missing `qd_friend_profiles`; Q-Level does not overwrite this user edit.
