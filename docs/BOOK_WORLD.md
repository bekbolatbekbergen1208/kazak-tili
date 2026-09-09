# Кітап әлемі

Routes: `/learn/books` and `/learn/books/[bookId]`. The existing literature lessons remain available at their original URLs.

15 original Kazakh study guides each include three reading sections, nine activities and a ten-question, three-minute final. Study sections are not presented as original chapters. The character-voice game explicitly uses imagined paraphrases, not authentic quotations. Open writing is checked for completeness, saved and rewarded for participation; no automatic literary grading is claimed. The guide to _Абай жолы_, _Ақбілек_, _Ботагөз_, _Қан мен тер_ and _Айқай_ omits graphic scenes.

Bibliographic corrections: _Бақбақ басы толған күн_ is by Марат Қабанбаев ([Abai Library](https://www.youtube.com/watch?v=b0UX752adc4)); _Айқай_ is a novella rather than a short story and is placed in the advanced group ([Қазақ әдебиеті](https://qazaqadebieti.kz/18470/aza-ty-tynymbajy)). Source links are also carried on book records. Catalog age levels describe the adapted guides, not the complete originals. Read times are estimates including activities.

## Persistence and rewards

`progress.reading` is stored inside the existing `qd_learning_states.state` JSONB through `/api/learning`. Old accounts hydrate without resetting progress. Demo data uses the existing browser storage. Account saves require existing migrations 001–007 and `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) on the Next.js server. No new SQL is needed for reading progress itself. Never put a server key in a `NEXT_PUBLIC_` variable.

Each first chapter awards 5 XP and 1 coin; each first activity awards 10 XP, 2 coins and 1 crystal. Each new best final-test point awards 5 XP and 1 coin. The first passing score (7/10 or higher) awards 50 XP, 20 coins and 5 crystals and unlocks the certificate and badge. Rewards use the shared national-game ledger and wallet, so crystals can upgrade companions and coins can buy equipment. Global character XP thresholds and level celebrations continue to work. Repeated passes cannot farm rewards. Daily reading and global streaks use UTC, as the existing learning engine does.

The server owns final-test start time and grading. Resuming never resets the deadline. Answers are immutable during an attempt; after expiry only finishing is allowed. The result screen provides explanations and retry with shuffled questions. Failed saves retain the UI answer for retry; users must explicitly save writing. Certificates print through the browser's Print / Save as PDF dialog and are not official qualifications.

## Invitation-only friends league

Apply `supabase/migrations/202609090008_book_friends.sql` in Supabase SQL Editor to enable the league. It adds opt-in membership and friendship tables; direct access from anonymous or authenticated clients is revoked. The authenticated server endpoint uses the server key, verifies ownership, and returns only linked participants' nickname, completed-book count and reading XP. It never returns their full learning state, answers, email or invitation code. Reading drafts stay private.

Enable league → share the random 12-character code → friend enters it → both see each other, ordered by completed books then reading XP. Remove severs the connection on both sides. Demo mode has no invented opponents. Unconfigured leagues show a recoverable unavailable state and do not prevent reading. Production league verification requires applying the migration and two real opted-in accounts.

## Validation

`tests/books.test.ts` covers catalog integrity, gates, malformed payloads, reward replay, retry improvement, persistence, deadlines, certificates and streaks. `tests/sql.test.ts` covers league table permissions and cascading removal. `tests/browser/books.spec.ts` covers desktop/mobile reading, activities, final, printing layout and reload persistence.
