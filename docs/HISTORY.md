# Тарих әлеміне саяхат

Routes: `/learn/history`, `/learn/history/[cityId]`, `/learn/history/notebook`.
The history mode and its shared navigation/reward copy are in Kazakh. Existing language preferences and other learning modes are preserved.

## Playable first release

The Kazakhstan map reuses the project's licensed `/travel/boundaries.json` vector asset. Locations, city scenes, routes and buildings are stylized learning illustrations, not precise historical reconstructions. The map has ten selectable places. Otyrar, Turkistan and Taraz are fully playable, sequentially unlocked. Seven future directions explicitly say they are in development.

Each playable city has a three-part Dossha introduction, five discoverable objects with a short fact, vocabulary explanation, original animated vector learning card and external source, four different tasks, and a 90-second final hunt for three objects identified by vocabulary clues. Timeline/order, caravan route, matching, assembly, multiple-choice and role dialogue are supported. Incorrect answers give a hint without deducting balances. The notebook contains discoveries, visited/completed cities, topics, people, badges, ranks and next target.

Keyboard WASD/arrow keys operate when the map/scene itself has focus. Direction buttons support pointer hold and keyboard activation. Blur, pointer cancellation and hidden tabs stop movement. Direct buttons and an alternative object list make discovery accessible without precision movement. Object interactions save an approach position; the explicit save-position button also saves free movement. Reduced motion and the existing animation setting stop decorative animation. Day/night is persistent.

## State and rewards

`lib/history/state.ts` validates actions through the existing `applyAction` reducer and `/api/learning` allowlist. Data lives under `LearningState.progress.history` in the existing `qd_learning_states.state` JSONB; history needs no new table or migration.

Each first discovery grants 5 XP and 1 coin. Each first correct task grants 15 XP and 3 coins; route/assembly additionally grant one crystal. First city completion grants 60 XP, 20 coins, 3 crystals, the city's badge and an existing universally compatible inventory item (backpack, shapan, taqiya). Shared national reward transaction IDs prevent repeat rewards. XP also uses the existing character unlock/level system. Three completed cities give 435 history XP, 111 history coins and 12 crystals, before any global level bonuses. Equipment can be applied immediately to the current companion.

The final's start timestamp and targets are saved; reopening an active attempt cannot restart its deadline. Only the next correct object counts. Expired attempts can be finished and retried with a changed order. Cities and final tasks cannot be skipped through API actions. Ranks require 0, 1, 2, 3 and 10 completed cities; the last rank becomes attainable as future directions are authored.

## Database and local fallback

Authenticated GET `/api/learning` reports `writable`. Server writes require `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` and the existing learning schema. A missing learning table or absent writer key enables an explicit local mode. Other database/network failures still show an error and retry.

The provider stores local fallback progress under `qazaqdos-learning-local-<authenticated-user-id>`. Guest/demo mode keeps its existing `qazaqdos-learning-demo-v1` key. This lets onboarding, history and the shared wallet work without server writer credentials. The UI clearly labels browser-only storage. Writes do not silently claim cloud synchronization. Local data is separate per account, persists reload, and reacts to storage events in another tab. Local storage is not tamper-proof and does not qualify as authoritative leaderboard data.

When the server writer becomes available, the provider uses the authoritative cloud state. Browser-only rewards are **not automatically imported** into it. For reliable multi-device progress, configure the writer before learners begin. Clearing browser storage removes local-only progress. Existing cloud state is never overwritten by a local snapshot.

## Content and extension

`lib/history/catalog.ts` contains all city metadata, map positions, intro lines, source URLs, objects, vocabulary, task options/answers, historical people, item IDs and rewards. `types.ts` defines the data contract. The components under `components/history` render that contract; `app/learn/history/history.css` contains scoped styles and lightweight animations.

To release another city:

1. Fill the existing placeholder in `historyCities` with verified sources, three introduction lines, five objects and four tasks. Keep stable IDs and specify its `previous` city.
2. Use a supported task kind. `timeline`, `route`, `match` and `build` answers serialize an ordered string array; `choice` and `dialogue` use the exact selected option. Route tasks currently expect three selected stops. Assembly/matching use `labels` for the slots.
3. Provide an existing equipment `itemId` compatible with every companion, a badge and reward values. Add new art to `HistoryArt` only if a genuinely new object kind is needed.
4. Set `ready: true`. The next unlock, generic city route, progress denominators and notebook collection totals update automatically. Update content-coherence tests when the number of released cities changes. Each final hunt needs at least three distinct objects.
5. Extend reducer and browser coverage with at least one complete playthrough and the new source checks. Keep historical fact, folklore and fictional instructional dialogue clearly distinguished.

Primary references are linked beside each object: Otyrar museum and Kazakhstan History for Otyrar; UNESCO World Heritage and Aziret Sultan museum for Yasawi/Taiqazan; Ancient Taraz museum and Kazakhstan History for Taraz. Otyrar library size/world ranking is not asserted. 568 is a written mention of Taraz, not a claimed foundation date. Aisha Bibi folklore is explicitly labeled as legend. No full copyrighted literary text or museum image is copied.

## Verification

`tests/history.test.ts`: data coherence, stage gates, bad inputs, idempotent rewards, deadline/retry, persistent state, equipment compatibility and ranks.

`tests/browser/history.spec.ts`: desktop/mobile onboarding → map → movement → all three cities → discoveries → varied tasks with incorrect-answer feedback → timed final → outfit → notebook → reload. Also account-scoped browser fallback and failed-map recovery via the city list. Browser errors and horizontal overflow are checked. Screenshots are written to `test-results/history-*.png`.

Commands: `npm run build`, `npm test` (or `node --import tsx --test tests/*.test.ts`), `npx tsc --noEmit`, and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3016 npx playwright test tests/browser/history.spec.ts` against a restarted production build.
