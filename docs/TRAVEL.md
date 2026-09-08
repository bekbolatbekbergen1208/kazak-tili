# Қазақстанға саяхат

Run with Node 22: `npm install`, `npm run dev`. Entry: `/kazakhstan`.
Demo: `/kazakhstan?demo=1` (finish onboarding first); browser-only progress uses
existing `qazaqdos-learning-demo-v1`. Accounts use the existing learning API.
No account/demo data are imported into one another.

## Implemented

- Real Mercator administrative geometry, all 17 regions and 3 republican cities.
  Source/permission/hash: `public/travel/ATTRIBUTION.md`. No invented boundaries.
  Almaty city and region have different IDs/routes. Local 20-feature JSON is loaded
  once, with searchable links as an independent fallback.
- Selected existing animal and equipment; CSS travel, interrupt/skip, shared SVG
  camera, keyboard paths/markers, 1–4× zoom, persisted camera and last visited region.
  Enlarged maps support pointer dragging and accessible directional buttons;
  object markers open descriptions and focus the shared camera at 4×. At 1×,
  ordinary touch scrolling remains available.
- All 20 direct region routes, original vector scene/icon illustrations, clickable
  objects, vocabulary exercises, five-question quiz, picture/concept matching and
  tap/keyboard sentence builder. All exercise answers are evaluated in the reducer.
- Existing XP/coin ledger, total XP based character unlocks, no second currency.
  Per-region rewards: visit 10, complete reading 20, first quiz 30, first perfect
  quiz 20, all region words 15, complete region 100. Region completion also gives
  existing section reward of 30 coins. Replay events cannot duplicate these.
- Passport, unique indexed stamps, travel titles, derived achievements, queued
  notifications after character and account-level notifications.
- Audio opt-in (off initially); only genuine `kk` speech voices, on user click.
  Full/light/off animation, reduced-motion and tab/offscreen pause; modest-device
  fallback. No new animation/map libraries, audio assets or external images.

## Content status — not a complete 20-region encyclopedia

Mangystau has the seven required reading categories, four sourced animals with
explicit protection evidence, local plants, historical events, notable author,
eight landmarks, food/culture and economic use chains. It can earn a stamp.

Pavlodar also has seven reading categories, three protected animals and three
rare plants, a dated timeline, Satpayev's local connection, qymyz/craft traditions,
economic chains and a regional quiz. It can earn a stamp. Jetysu has six sourced
animal cards and three rare plants; Kostanay has three protected bird cards.
Nature (20 cards) and history (five tasks) achievements are now attainable.

Atyrau now includes the Akzhaiyk ecosystem and protected species, Saraishyq
archaeology, regional music/food, refining and agriculture, and a sourced quiz.
Its stamp also makes the two-region Caspian achievement attainable.

The other 17 territories are explicitly `partial` and cannot earn completion or
reading-completion rewards/stamps. They have at least 10 words (13 including
additional language practice), five questions, matching, sentences, destination
notes and references. Some have reviewed wildlife/history cards. They still need
complete regional wildlife/protection, flora, culture/food/people, economic chains
and individual landmark descriptions. See each record's `missingContent`.
The system does not treat empty cards as reviewed content. Avoid changing status
without checking every category. Several overview tourism sources predate the
2022 split: only geographically valid destinations were retained; their broader
old administrative claims and health/superlative claims were not adopted.

All illustrations are schematic original SVG, not photographs or zoological
identification plates. Country boundaries are geographic; local scene/object
positions and gameplay routes are illustrative, not precise navigation. This
release does not implement parallax, photographed landmark
matching, geographically verified object positions at every camera scale, all requested ambient
sound/effects, or measured 60 FPS. Do not claim those are complete.

## Cloud setup and security

Existing migrations 001–004 must already be applied. Add a SERVER-ONLY variable:

```ini
SUPABASE_SECRET_KEY=your_project_server_secret
```

Legacy `SUPABASE_SERVICE_ROLE_KEY` is also accepted. Never prefix it NEXT_PUBLIC,
commit it, or paste it into the app. The supplied publishable key is insufficient.
Configure the server key first, deploy API changes, then apply 005 and 006 in order:

- `202609080005_travel_progress.sql`: owner-filtered security-invoker read view.
- `202609080006_server_owned_progress.sql`: revoke browser writes to the aggregate;
  service-role server writer preserves every existing state and revision.

The API authenticates the user with `auth.getUser()`, computes results against
server content, scopes reads/writes to that user, and checks a revision on update.
Concurrent stale updates fail with 409; replaying against the latest revision is
idempotent. Missing server key returns 503 for travel saving; legacy learning
writes retain their prior behavior until deployment of migration 006. Until 006
is applied, owner RLS alone does NOT prevent a user modifying their own balance
via direct REST, even if the API validates actions. Apply both migrations before
calling cloud travel protected. No migration was executed on the hosted project:
only its public client credential is available. PGlite tests verify SQL locally.

## Files and checks

- `lib/travel`: catalog, sourced editorial additions, vocabulary, types, reducer.
- `components/travel`: map, scenes, icons, region pages, games, passport/settings,
  motion handling and notifications.
- `app/kazakhstan`: routes and isolated CSS.
- `lib/learning/{types,state}.ts`, provider/frame and API: integration.
- `utils/supabase/admin.ts`, migrations 005/006: server writer and RLS grants.
- `tests/travel.test.ts`, `tests/browser/travel.spec.ts`, extended SQL test.

`npm test`, `npm run typecheck`, `npm run build`.
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3011 npm run test:e2e` after starting server.
Chrome is used through the existing Playwright setup. Browser tests cover desktop
and phone, all direct routes, fallback, object learning, three games, reload,
movement interruption, zoom persistence, reduced motion, and layout width.
